import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Send, Loader2 } from 'lucide-react'
import type { EffortLevel, ValidationResult } from '../types'

interface InputFormProps {
  onSubmit: (content: string, effort: EffortLevel) => void
  isLoading: boolean
  disabled?: boolean
}

const effortConfig = {
  low: { queries: 1, loops: 1 },
  medium: { queries: 3, loops: 3 },
  high: { queries: 5, loops: 10 }
}

const validateInput = (input: string): ValidationResult => {
  if (!input.trim()) {
    return { isValid: false, error: 'Message cannot be empty' }
  }
  
  if (input.length > 2000) {
    return { isValid: false, error: 'Message too long (max 2000 characters)' }
  }
  
  return { isValid: true }
}

export function InputForm({ onSubmit, isLoading, disabled = false }: InputFormProps) {
  const [message, setMessage] = useState('')
  const [effort, setEffort] = useState<EffortLevel>('medium')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const validation = validateInput(message)
    if (!validation.isValid) {
      setError(validation.error || 'Invalid input')
      return
    }

    setError(null)
    onSubmit(message, effort)
    setMessage('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e)
    }
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Message Input */}
          <div className="space-y-2">
            <Textarea
              placeholder="Ask me anything to research..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled || isLoading}
              className="min-h-[100px] resize-none"
              maxLength={2000}
            />
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <div className="text-xs text-gray-500 text-right">
              {message.length}/2000
            </div>
          </div>

          {/* Controls Row */}
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            {/* Research Effort */}
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Research Effort</label>
              <Select value={effort} onValueChange={(value: EffortLevel) => setEffort(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Low</Badge>
                      <span className="text-xs text-gray-500">
                        {effortConfig.low.queries} queries, {effortConfig.low.loops} loops
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Medium</Badge>
                      <span className="text-xs text-gray-500">
                        {effortConfig.medium.queries} queries, {effortConfig.medium.loops} loops
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">High</Badge>
                      <span className="text-xs text-gray-500">
                        {effortConfig.high.queries} queries, {effortConfig.high.loops} loops
                      </span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              disabled={disabled || isLoading || !message.trim()}
              className="min-w-[120px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Researching...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Research
                </>
              )}
            </Button>
          </div>

          {/* Keyboard Hint */}
          <div className="text-xs text-gray-500">
            Press Cmd/Ctrl + Enter to submit
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 