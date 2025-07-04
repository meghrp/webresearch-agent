import { useEffect, useRef, useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Copy, User, Bot, AlertCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import type { Message, ProcessedEvent, EffortLevel, ReasoningModel } from '../types'
import { ActivityTimeline } from './ActivityTimeline'
import { InputForm } from './InputForm'
import { cn } from '@/lib/utils'

interface ChatMessagesViewProps {
  messages: Message[]
  processedEventsTimeline: ProcessedEvent[]
  historicalActivities: Record<string, ProcessedEvent[]>
  isLoading: boolean
  onSubmit: (content: string, effort: EffortLevel, model: ReasoningModel) => void
  error?: string | null
}

export function ChatMessagesView({ 
  messages, 
  processedEventsTimeline, 
  historicalActivities,
  isLoading, 
  onSubmit, 
  error 
}: ChatMessagesViewProps) {
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  // useEffect(() => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  // }, [messages, processedEventsTimeline])

  const handleCopyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedMessageId(messageId)
      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch (err) {
      console.error('Failed to copy message:', err)
    }
  }

  const getMessageIcon = (type: Message['type']) => {
    switch (type) {
      case 'human':
        return <User className="w-4 h-4" />
      case 'ai':
        return <Bot className="w-4 h-4" />
      case 'system':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Bot className="w-4 h-4" />
    }
  }

  const getMessageBubbleClasses = (type: Message['type']) => {
    const baseClasses = "rounded-lg p-4 max-w-[100%] sm:max-w-[90%] md:max-w-[80%] lg:max-w-[70%]"
    
    switch (type) {
      case 'human':
        return cn(baseClasses, "bg-blue-600 text-white ml-auto")
      case 'ai':
        return cn(baseClasses, "bg-gray-100 dark:bg-gray-800 mr-auto")
      case 'system':
        return cn(baseClasses, "bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 mx-auto")
      default:
        return cn(baseClasses, "bg-gray-100 dark:bg-gray-800")
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
        <div className="space-y-6 pb-4">
          {messages.map((message, index) => (
            <div key={message.id} className="flex flex-col gap-3">
              {/* Message Bubble */}
              <div className={cn("flex items-start gap-3", 
                message.type === 'human' ? 'flex-row-reverse' : 'flex-row'
              )}>
                {/* Avatar */}
                <div className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                  message.type === 'human' 
                    ? "bg-blue-600 text-white" 
                    : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                )}>
                  {getMessageIcon(message.type)}
                </div>

                {/* Message Content */}
                <div className={getMessageBubbleClasses(message.type)}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {message.type === 'human' ? 'You' : message.type === 'ai' ? 'AI Research Agent' : 'System'}
                      </Badge>
                      <span className="text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                      onClick={() => handleCopyMessage(message.id, message.content)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>

                  {/* Message Content with Markdown Support */}
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {message.type === 'ai' ? (
                      <ReactMarkdown
                        components={{
                          // Custom link styling with badge
                          a: ({ href, children }) => (
                            <Badge variant="outline" asChild>
                              <a 
                                href={href} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 hover:bg-blue-100 dark:hover:bg-blue-900"
                              >
                                {children}
                              </a>
                            </Badge>
                          ),
                          // Custom code styling
                          code: ({ children, className }) => (
                            <code className={cn(
                              "bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm",
                              className
                            )}>
                              {children}
                            </code>
                          )
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>

                  {/* Copy Success Indicator */}
                  {copiedMessageId === message.id && (
                    <div className="text-xs text-green-600 dark:text-green-400 mt-2">
                      Copied to clipboard!
                    </div>
                  )}
                </div>
              </div>

              {/* Activity Timeline for AI messages */}
              {message.type === 'ai' && (
                <div className="ml-11">
                  {/* Current activity (if this is the latest AI message) */}
                  {index === messages.length - 1 && (
                    <ActivityTimeline 
                      events={processedEventsTimeline}
                      isLoading={isLoading}
                      className="mb-4"
                    />
                  )}
                  
                  {/* Historical activities */}
                  {historicalActivities[message.id] && (
                    <ActivityTimeline 
                      events={historicalActivities[message.id]}
                      isLoading={false}
                      className="mb-4"
                    />
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-200">Error</p>
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            </div>
          )}

          {/* Loading indicator when waiting for first response */}
          {messages.length === 0 && isLoading && (
            <div className="flex justify-center items-center py-8">
              <ActivityTimeline 
                events={processedEventsTimeline}
                isLoading={isLoading}
              />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Form */}
      <div className="border-t p-4">
        <InputForm 
          onSubmit={onSubmit}
          isLoading={isLoading}
          disabled={!!error}
        />
      </div>
    </div>
  )
} 