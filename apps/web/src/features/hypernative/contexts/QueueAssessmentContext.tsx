import { createContext, type ReactNode } from 'react'
import type { ThreatAnalysisResults } from '@safe-global/utils/features/safe-shield/types'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import type { QueuedItemPage, TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

export interface QueueAssessmentContextValue {
  assessments: Record<`0x${string}`, AsyncResult<ThreatAnalysisResults>>
  isLoading: boolean
  setPages: (pages: QueuedItemPage[], sourceKey?: string | symbol) => void
  setTx: (txDetails: TransactionDetails | undefined, sourceKey?: string | symbol) => void
}

export const QueueAssessmentContext = createContext<QueueAssessmentContextValue | undefined>(undefined)

export interface QueueAssessmentProviderProps {
  children: ReactNode
  value: QueueAssessmentContextValue
}

export const QueueAssessmentProvider = ({ children, value }: QueueAssessmentProviderProps) => {
  return <QueueAssessmentContext.Provider value={value}>{children}</QueueAssessmentContext.Provider>
}
