import { useState, useEffect, useRef, useCallback } from 'react'
import { useStream } from '@langchain/langgraph-sdk/react'
import { ChatMessagesView } from './components/ChatMessagesView'
import { WelcomeScreen } from './components/WelcomeScreen'
import type { ProcessedEvent, EffortLevel } from './types'
import type { Message } from '@langchain/langgraph-sdk'

function App() {
  const [processedEventsTimeline, setProcessedEventsTimeline] = useState<ProcessedEvent[]>([])
  const [historicalActivities, setHistoricalActivities] = useState<Record<string, ProcessedEvent[]>>({})
  const [error, setError] = useState<string | null>(null)
  const finalizedEvent = useRef(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  // LangGraph SDK stream configuration
  const thread = useStream<{
    messages: Message[];
    initial_search_query_count: number;
    max_research_loops: number;
  }>({
    apiUrl: import.meta.env.DEV ? "http://localhost:2024" : "http://localhost:8123",
    assistantId: "agent",
    messagesKey: "messages",
    onUpdateEvent: (event: any) => {
      console.log('Agent event:', event)
      const processedEvent = processAgentEvent(event)
      if (processedEvent) {
        setProcessedEventsTimeline(prev => [...prev, processedEvent!])
      }
    },
    onError: (err: any) => {
      console.error('Stream error:', err)
      handleStreamError(err)
    }
  })

  // Process agent events into UI-friendly format
  const processAgentEvent = (event: any): ProcessedEvent | null => {
    if (event.generate_query) {
      return {
        title: "Generating Search Queries",
        data: event.generate_query.search_query?.join(", ") || ""
      }
    }
    
    if (event.web_research) {
      const sources = event.web_research.sources_gathered || [];
      const numSources = sources.length;
      const uniqueLabels = [
        ...new Set(sources.map((s: any) => s.label).filter(Boolean)),
      ];
      const exampleLabels = uniqueLabels.slice(0, 3).join(", ");
      return {
        title: "Web Research",
        data: `Gathered ${numSources} sources. Related to: ${
          exampleLabels || "N/A"
        }.`,
      }
    }
    
    if (event.reflection) {
      return {
        title: "Reflection",
        data: "Analyzing research results"
      }
    }
    
    if (event.finalize_answer) {
      finalizedEvent.current = true;
      return {
        title: "Finalizing Answer",
        data: "Composing and presenting the final answer."
      }
    }

    return null
  }

  // Error handling
  const handleStreamError = (err: any) => {
    if (err.code === 'NETWORK_ERROR') {
      setError('Connection lost. Please check your network and try again.')
    } else if (err.code === 'AGENT_ERROR') {
      setError('Agent encountered an error. Please try again.')
    } else {
      setError(err.message || 'An unexpected error occurred.')
    }
  }

  // Effort level to config mapping
  const getEffortConfig = (effort: EffortLevel) => {
    const configs = {
      low: { queries: 1, loops: 1 },
      medium: { queries: 3, loops: 3 },
      high: { queries: 5, loops: 10 }
    }
    return configs[effort]
  }

  const handleSubmit = useCallback((content: string, effort: EffortLevel) => {
    if (!content.trim()) return;
    setError(null)

    setProcessedEventsTimeline([])
    finalizedEvent.current = false;

    const effortConfig = getEffortConfig(effort)

    const newMessages: Message[] = [
      ...(thread.messages || []),
      {
        type: "human",
        content: content,
        id: Date.now().toString(),
      },
    ];

    thread.submit({
      messages: newMessages,
      initial_search_query_count: effortConfig.queries,
      max_research_loops: effortConfig.loops,
    })
  },[thread]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  }, [thread.messages]);

  // Handle agent response
  useEffect(() => {
    if (finalizedEvent.current && !thread.isLoading && processedEventsTimeline.length > 0) {
      const lastMessage = thread.messages[thread.messages.length - 1];
      if (lastMessage && lastMessage.type === "ai" && lastMessage.id) {
        setHistoricalActivities((prev) => ({
          ...prev,
          [lastMessage.id!]: [...processedEventsTimeline],
        }));
      }
      finalizedEvent.current = false;
      setProcessedEventsTimeline([])
    }
  }, [thread.messages, thread.isLoading, processedEventsTimeline])

  const handleCancel = useCallback(() => {
    thread.stop();
    window.location.reload();
  }, [thread]);

  const hasMessages = thread.messages.length > 0

  return (
    <div className="min-h-screen bg-background">
      {hasMessages ? (
        <div className="container mx-auto h-screen flex flex-col">
          <ChatMessagesView
            messages={thread.messages}
            processedEventsTimeline={processedEventsTimeline}
            historicalActivities={historicalActivities}
            isLoading={thread.isLoading}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            error={error}
          />
        </div>
      ) : (
        <WelcomeScreen
          onSubmit={handleSubmit}
          isLoading={thread.isLoading}
          onCancel={handleCancel}
        />
      )}
    </div>
  )
}

export default App
