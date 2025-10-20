import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useRecipientAnalysis } from './hooks'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import type { RecipientAnalysisResults } from '@safe-global/utils/features/safe-shield/types'

type SafeShieldContextType = {
  setRecipientAddresses: (addresses: string[]) => void
  recipientAnalysis: AsyncResult<RecipientAnalysisResults>
}

const SafeShieldContext = createContext<SafeShieldContextType | null>(null)

export const SafeShieldProvider = ({ children }: { children: ReactNode }) => {
  const [recipientAddresses, setRecipientAddresses] = useState<string[]>([])
  const recipientAnalysis = useRecipientAnalysis(recipientAddresses)

  return (
    <SafeShieldContext.Provider value={{ setRecipientAddresses, recipientAnalysis }}>
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
  const { setRecipientAddresses, recipientAnalysis } = useSafeShield()

  useEffect(() => {
    setRecipientAddresses(recipientAddresses)
  }, [recipientAddresses, setRecipientAddresses])

  return recipientAnalysis
}
