export interface Message {
  id: string
  type: 'human' | 'ai' | 'system'
  content: string
  timestamp: Date
}

export interface ProcessedEvent {
  title: string
  data: any
}

export interface AppState {
  processedEventsTimeline: ProcessedEvent[]
  historicalActivities: Record<string, ProcessedEvent[]>
  error: string | null
}

export interface StreamConfig {
  apiUrl: string
  assistantId: string
  messagesKey: string
}

export interface AgentConfig {
  messages: Message[]
  initial_search_query_count: number
  max_research_loops: number
  reasoning_model: string
}

export interface EffortConfig {
  queries: number
  loops: number
}

export interface ValidationResult {
  isValid: boolean
  error?: string
}

export type EffortLevel = 'low' | 'medium' | 'high'