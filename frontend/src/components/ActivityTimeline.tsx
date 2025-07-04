import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Search, 
  Globe, 
  Brain, 
  CheckCircle, 
  Loader2, 
  ChevronDown, 
  ChevronUp,
  Activity 
} from 'lucide-react'
import type { ProcessedEvent } from '../types'

interface ActivityTimelineProps {
  events: ProcessedEvent[]
  isLoading: boolean
  className?: string
}

const getActivityIcon = (title: string, isLoading: boolean) => {
  const iconProps = { className: "w-4 h-4" }
  
  if (isLoading) {
    return <Loader2 className="w-4 h-4 animate-spin" />
  }

  switch (title) {
    case "Generating Search Queries":
      return <Search {...iconProps} />
    case "Web Research":
      return <Globe {...iconProps} />
    case "Reflection":
      return <Brain {...iconProps} />
    case "Finalizing Answer":
      return <CheckCircle {...iconProps} />
    default:
      return <Activity {...iconProps} />
  }
}

const getActivityBadgeVariant = (title: string) => {
  switch (title) {
    case "Generating Search Queries":
      return "default"
    case "Web Research":
      return "secondary"
    case "Reflection":
      return "outline"
    case "Finalizing Answer":
      return "default"
    default:
      return "secondary"
  }
}

export function ActivityTimeline({ events, isLoading, className = "" }: ActivityTimelineProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  if (events.length === 0 && !isLoading) {
    return null
  }

  return (
    <Card className={`w-full md:max-w-sm ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Agent Activity
          </CardTitle>
          {events.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-6 w-6 p-0"
            >
              {isCollapsed ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="pt-0">
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {events.map((event, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex-shrink-0 mt-0.5">
                    {getActivityIcon(event.title, false)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getActivityBadgeVariant(event.title)} className="text-xs">
                        {event.title}
                      </Badge>
                    </div>
                    
                    {event.data && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 break-words">
                        {typeof event.data === 'string' ? event.data : JSON.stringify(event.data)}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <div className="flex-shrink-0 mt-0.5">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="default" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        Processing...
                      </Badge>
                    </div>
                    
                    <div className="text-xs text-blue-600 dark:text-blue-400">
                      Agent is working on your request
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      )}
    </Card>
  )
} 