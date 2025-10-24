import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useCounterpartyAnalysis, useRecipientAnalysis, useThreatAnalysis } from './hooks'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import type { SafeTransaction } from '@safe-global/types-kit'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import type {
  ContractAnalysisResults,
  ThreatAnalysisResults,
  RecipientAnalysisResults,
} from '@safe-global/utils/features/safe-shield/types'

type SafeShieldContextType = {
  setRecipientAddresses: (addresses: string[]) => void
  setSafeTx: (safeTx: SafeTransaction) => void
  safeTx?: SafeTransaction
  recipient?: AsyncResult<RecipientAnalysisResults>
  contract?: AsyncResult<ContractAnalysisResults>
  threat?: AsyncResult<ThreatAnalysisResults>
}

const SafeShieldContext = createContext<SafeShieldContextType | null>(null)

export const SafeShieldProvider = ({ children }: { children: ReactNode }) => {
  const safeTxContext = useContext(SafeTxContext)
  const [recipientAddresses, setRecipientAddresses] = useState<string[] | undefined>(undefined)
  const [safeTx, setSafeTx] = useState<SafeTransaction | undefined>(undefined)

  const recipientOnlyAnalysis = useRecipientAnalysis(recipientAddresses)
  const counterpartyAnalysis = useCounterpartyAnalysis(safeTx)
  const threat = useThreatAnalysis()

  const recipient = recipientOnlyAnalysis || counterpartyAnalysis.recipient
  const contract = counterpartyAnalysis.contract

  return (
    <SafeShieldContext.Provider
      value={{ setRecipientAddresses, setSafeTx, safeTx: safeTx || safeTxContext.safeTx, recipient, contract, threat }}
    >
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

/**
 * Hook to register transaction data for Safe Shield analysis
 * @param txData - Transaction data to analyze
 */
export const useSafeShieldForTxData = (txData: SafeTransaction | undefined) => {
  const { setSafeTx } = useSafeShield()

  useEffect(() => {
    if (txData) {
      setSafeTx(txData)
    }
  }, [txData, setSafeTx])
}
