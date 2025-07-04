import { useState, useEffect, useRef, useCallback } from 'react'
import { useStream } from '@langchain/langgraph-sdk/react'
import { ChatMessagesView } from './components/ChatMessagesView'
import { WelcomeScreen } from './components/WelcomeScreen'
import type { Message, ProcessedEvent, EffortLevel } from './types'

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [processedEventsTimeline, setProcessedEventsTimeline] = useState<ProcessedEvent[]>([])
  const [historicalActivities, setHistoricalActivities] = useState<Record<string, ProcessedEvent[]>>({})
  const [error, setError] = useState<string | null>(null)
  const [currentStreamingMessageId, setCurrentStreamingMessageId] = useState<string | null>(null)
  const finalizedEvent = useRef(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  // LangGraph SDK stream configuration
  const thread = useStream({
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

  // Handle new message submission
  const handleSubmit = useCallback((content: string, effort: EffortLevel) => {
    setError(null)
    
    // Create user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'human',
      content,
      timestamp: new Date()
    }

    // Add user message to chat
    setMessages(prev => [...prev, userMessage])
    
    // Clear current timeline for new request
    setProcessedEventsTimeline([])
    setCurrentStreamingMessageId(null)

    // Get effort configuration
    const effortConfig = getEffortConfig(effort)

    // Submit to agent with configuration
    const agentConfig = {
      messages: [...messages, userMessage].map(msg => ({
        role: msg.type === 'human' ? 'user' : 'assistant',
        content: msg.content
      })),
      initial_search_query_count: effortConfig.queries,
      max_research_loops: effortConfig.loops,
    }

    thread.submit(agentConfig)
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
    if (thread.messages && thread.messages.length > 0) {
      const latestMessage = thread.messages[thread.messages.length - 1]
      
      // Only process assistant messages
      if (latestMessage.type === 'ai') {
        const messageContent = typeof latestMessage.content === 'string' ? latestMessage.content : JSON.stringify(latestMessage.content)

        setMessages(prev => {
          // If we don't have a current streaming message, create one
          if (!currentStreamingMessageId) {
            const newMessageId = `ai-${Date.now()}`
            setCurrentStreamingMessageId(newMessageId)
            
            const aiMessage: Message = {
              id: newMessageId,
              type: 'ai',
              content: messageContent,
              timestamp: new Date()
            }
            
            return [...prev, aiMessage]
          } else {
            // Update the existing streaming message
            return prev.map(msg => 
              msg.id === currentStreamingMessageId 
                ? { ...msg, content: messageContent }
                : msg
            )
          }
        })

        // Move timeline to historical activities when response is complete
        if (!thread.isLoading && processedEventsTimeline.length > 0 && currentStreamingMessageId) {
          setHistoricalActivities(prev => ({
            ...prev,
            [currentStreamingMessageId]: [...processedEventsTimeline]
          }))
          setProcessedEventsTimeline([])
          setCurrentStreamingMessageId(null)
        }
      }
    }
  }, [thread.messages, thread.isLoading, processedEventsTimeline])

  const hasMessages = messages.length > 0

  return (
    <div className="min-h-screen bg-background">
      {hasMessages ? (
        <div className="container mx-auto h-screen flex flex-col">
          <ChatMessagesView
            messages={messages}
            processedEventsTimeline={processedEventsTimeline}
            historicalActivities={historicalActivities}
            isLoading={thread.isLoading}
            onSubmit={handleSubmit}
            error={error}
          />
        </div>
      ) : (
        <WelcomeScreen
          onSubmit={handleSubmit}
          isLoading={thread.isLoading}
        />
      )}
    </div>
  )
}

export default App
