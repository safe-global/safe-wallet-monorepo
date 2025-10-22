import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useCounterpartyAnalysis, useRecipientAnalysis } from './hooks'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import type { ContractAnalysisResults, RecipientAnalysisResults } from '@safe-global/utils/features/safe-shield/types'

type SafeShieldContextType = {
  setRecipientAddresses: (addresses: string[]) => void
  recipient?: AsyncResult<RecipientAnalysisResults>
  contract?: AsyncResult<ContractAnalysisResults>
}

const SafeShieldContext = createContext<SafeShieldContextType | null>(null)

export const SafeShieldProvider = ({ children }: { children: ReactNode }) => {
  const [recipientAddresses, setRecipientAddresses] = useState<string[] | undefined>(undefined)

  const recipientOnlyAnalysis = useRecipientAnalysis(recipientAddresses)
  const counterpartyAnalysis = useCounterpartyAnalysis()

  const recipient = recipientOnlyAnalysis || counterpartyAnalysis.recipient
  const contract = counterpartyAnalysis.contract

  return (
    <SafeShieldContext.Provider value={{ setRecipientAddresses, recipient, contract }}>
      {children}
    </SafeShieldContext.Provider>
  )
}

export const useSafeShield = () => {
  const context = useContext(SafeShieldContext)
  if (!context) {
    throw new Error('useSafeShieldContext must be used within SafeShieldProvider')
  }
  return context
}

/**
 * Hook to register recipient addresses for Safe Shield analysis
 * @param recipientAddresses - Array of recipient addresses to analyze
 */
export const useSafeShieldForRecipients = (recipientAddresses: string[]) => {
  const { setRecipientAddresses, recipient } = useSafeShield()

  useEffect(() => {
    setRecipientAddresses(recipientAddresses)
  }, [recipientAddresses, setRecipientAddresses])

  return recipient
}
