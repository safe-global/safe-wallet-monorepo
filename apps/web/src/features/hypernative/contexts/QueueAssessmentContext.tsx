import { createContext, type ReactNode } from 'react'
import type { ThreatAnalysisResults } from '@safe-global/utils/features/safe-shield/types'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'

export interface QueueAssessmentContextValue {
  assessments: Record<`0x${string}`, AsyncResult<ThreatAnalysisResults>>
  isLoading: boolean
}

export const QueueAssessmentContext = createContext<QueueAssessmentContextValue | undefined>(undefined)

export interface QueueAssessmentProviderProps {
  children: ReactNode
  value: QueueAssessmentContextValue
}

export const QueueAssessmentProvider = ({ children, value }: QueueAssessmentProviderProps) => {
  return <QueueAssessmentContext.Provider value={value}>{children}</QueueAssessmentContext.Provider>
}
