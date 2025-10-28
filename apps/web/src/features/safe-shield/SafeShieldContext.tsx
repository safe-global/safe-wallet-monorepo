import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  useMemo,
  type Dispatch,
  type SetStateAction,
} from 'react'
import { useCounterpartyAnalysis, useRecipientAnalysis, useThreatAnalysis } from './hooks'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import type { SafeTransaction } from '@safe-global/types-kit'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import {
  type ContractAnalysisResults,
  type ThreatAnalysisResults,
  type RecipientAnalysisResults,
  Severity,
} from '@safe-global/utils/features/safe-shield/types'
import { getPrimaryResult, SEVERITY_PRIORITY } from '@safe-global/utils/features/safe-shield/utils'

type SafeShieldContextType = {
  setRecipientAddresses: (addresses: string[]) => void
  setSafeTx: Dispatch<SetStateAction<SafeTransaction | undefined>>
  safeTx?: SafeTransaction
  recipient?: AsyncResult<RecipientAnalysisResults>
  contract?: AsyncResult<ContractAnalysisResults>
  threat?: AsyncResult<ThreatAnalysisResults>
  needsRiskConfirmation: boolean
  isRiskConfirmed: boolean
  setIsRiskConfirmed: Dispatch<SetStateAction<boolean>>
}

const SafeShieldContext = createContext<SafeShieldContextType | null>(null)

export const SafeShieldProvider = ({ children }: { children: ReactNode }) => {
  const safeTxContext = useContext(SafeTxContext)
  const [recipientAddresses, setRecipientAddresses] = useState<string[] | undefined>(undefined)
  const [safeTx, setSafeTx] = useState<SafeTransaction | undefined>(undefined)

  const recipientOnlyAnalysis = useRecipientAnalysis(recipientAddresses)
  const counterpartyAnalysis = useCounterpartyAnalysis(safeTx)
  const threat = useThreatAnalysis(safeTx)

  const recipient = recipientOnlyAnalysis || counterpartyAnalysis.recipient
  const contract = counterpartyAnalysis.contract

  const [isRiskConfirmed, setIsRiskConfirmed] = useState(false)

  const needsRiskConfirmation = useMemo(() => {
    const [threatAnalysisResult] = threat || []
    const primaryThreatResult = getPrimaryResult(threatAnalysisResult?.THREAT || [])
    return (
      !!primaryThreatResult && SEVERITY_PRIORITY[primaryThreatResult.severity] <= SEVERITY_PRIORITY[Severity.CRITICAL]
    )
  }, [threat])

  return (
    <SafeShieldContext.Provider
      value={{
        setRecipientAddresses,
        setSafeTx,
        safeTx: safeTx || safeTxContext.safeTx,
        recipient,
        contract,
        threat,
        needsRiskConfirmation,
        isRiskConfirmed,
        setIsRiskConfirmed,
      }}
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
