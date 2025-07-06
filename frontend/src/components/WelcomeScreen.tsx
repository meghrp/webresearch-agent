import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Globe, 
  Brain, 
  CheckCircle,
  Zap,
  Clock,
  Target
} from 'lucide-react'
import { InputForm } from './InputForm'
import type { EffortLevel } from '../types'

interface WelcomeScreenProps {
  onSubmit: (content: string, effort: EffortLevel) => void
  isLoading: boolean
  onCancel: () => void
}

const effortLevels = [
  {
    level: 'low' as EffortLevel,
    icon: <Zap className="w-5 h-5" />,
    title: 'Quick Research',
    description: '1 search query, 1 research loop',
    timeEstimate: '~30 seconds',
    useCases: ['Simple facts', 'Basic definitions', 'Quick answers']
  },
  {
    level: 'medium' as EffortLevel,
    icon: <Target className="w-5 h-5" />,
    title: 'Standard Research',
    description: '3 search queries, 3 research loops',
    timeEstimate: '~2-3 minutes',
    useCases: ['Comparative analysis', 'Current events', 'Detailed explanations']
  },
  {
    level: 'high' as EffortLevel,
    icon: <Clock className="w-5 h-5" />,
    title: 'Deep Research',
    description: '5 search queries, 10 research loops',
    timeEstimate: '~5-10 minutes',
    useCases: ['Complex topics', 'Academic research', 'Comprehensive reports']
  }
]

const researchSteps = [
  {
    icon: <Search className="w-6 h-6 text-blue-600" />,
    title: 'Generate Search Queries',
    description: 'AI analyzes your question and creates targeted search queries'
  },
  {
    icon: <Globe className="w-6 h-6 text-green-600" />,
    title: 'Web Research',
    description: 'Searches the web and gathers information from multiple sources'
  },
  {
    icon: <Brain className="w-6 h-6 text-purple-600" />,
    title: 'Reflection & Analysis',
    description: 'Analyzes gathered information and identifies knowledge gaps'
  },
  {
    icon: <CheckCircle className="w-6 h-6 text-emerald-600" />,
    title: 'Finalize Answer',
    description: 'Synthesizes research into a comprehensive, well-sourced response'
  }
]

export function WelcomeScreen({ onSubmit, isLoading, onCancel }: WelcomeScreenProps) {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
          AI Research Agent
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Ask me anything and I'll conduct comprehensive research using the latest web information 
          to provide you with accurate, well-sourced answers.
        </p>
      </div>

      {/* Research Process */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {researchSteps.map((step, index) => (
              <div key={index} className="text-center space-y-3">
                <div className="flex justify-center">
                  {step.icon}
                </div>
                <h3 className="font-semibold text-sm">{step.title}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Research Effort Levels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Research Effort Levels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {effortLevels.map((effort) => (
              <div key={effort.level} className="space-y-3 p-4 rounded-lg border bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center gap-2">
                  {effort.icon}
                  <h3 className="font-semibold">{effort.title}</h3>
                  <Badge variant="outline" className="ml-auto">
                    {effort.level}
                  </Badge>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {effort.description}
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <Clock className="w-3 h-3" />
                    <span className="text-gray-500">{effort.timeEstimate}</span>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Best for:
                    </p>
                    <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                      {effort.useCases.map((useCase, index) => (
                        <li key={index} className="flex items-center gap-1">
                          <div className="w-1 h-1 bg-gray-400 rounded-full flex-shrink-0" />
                          {useCase}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Example Questions */}
      <Card>
        <CardHeader>
          <CardTitle>Example Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">Quick Research</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• What is the current price of Bitcoin?</li>
                <li>• Who won the latest Nobel Peace Prize?</li>
                <li>• What's the weather like in Tokyo today?</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">Deep Research</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Analyze the impact of AI on healthcare in 2024</li>
                <li>• Compare renewable energy policies across Europe</li>
                <li>• What are the latest developments in quantum computing?</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Input Form */}
      <div className="sticky bottom-6">
        <InputForm 
          onSubmit={onSubmit}
          isLoading={isLoading}
          onCancel={onCancel}
        />
      </div>
    </div>
  )
} 