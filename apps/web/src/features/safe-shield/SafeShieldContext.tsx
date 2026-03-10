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
import useUntrustedSafeAnalysis from './hooks/useUntrustedSafeAnalysis'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import type { SafeTransaction } from '@safe-global/types-kit'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import {
  type ContractAnalysisResults,
  type ThreatAnalysisResults,
  type RecipientAnalysisResults,
  type DeadlockAnalysisResults,
  type SafeAnalysisResult,
  Severity,
} from '@safe-global/utils/features/safe-shield/types'
import { getPrimaryResult, isSeverityHigherOrEqual } from '@safe-global/utils/features/safe-shield/utils'
import { useAuthToken } from '@/features/hypernative'

type SafeShieldContextType = {
  setRecipientAddresses: Dispatch<SetStateAction<string[] | undefined>>
  setSafeTx: Dispatch<SetStateAction<SafeTransaction | undefined>>
  safeTx?: SafeTransaction
  recipient: AsyncResult<RecipientAnalysisResults>
  contract: AsyncResult<ContractAnalysisResults>
  threat: AsyncResult<ThreatAnalysisResults>
  deadlock: AsyncResult<DeadlockAnalysisResults>
  needsRiskConfirmation: boolean
  isRiskConfirmed: boolean
  setIsRiskConfirmed: Dispatch<SetStateAction<boolean>>
  // Safe-level analysis (untrusted Safe check)
  safeAnalysis: SafeAnalysisResult | null
  addToTrustedList: () => void
}

const SafeShieldContext = createContext<SafeShieldContextType | null>(null)

export const SafeShieldProvider = ({ children }: { children: ReactNode }) => {
  const safeTxContext = useContext(SafeTxContext)
  const [recipientAddresses, setRecipientAddresses] = useState<string[] | undefined>(undefined)
  const [safeTx, setSafeTx] = useState<SafeTransaction | undefined>(undefined)

  const recipientOnlyAnalysis = useRecipientAnalysis(recipientAddresses)
  const counterpartyAnalysis = useCounterpartyAnalysis(safeTx)
  const [{ token: hypernativeAuthToken }] = useAuthToken()
  const threat = useThreatAnalysis(safeTx, hypernativeAuthToken) ?? [undefined, undefined, false]
  const [threatAnalysisResult] = threat

  const deadlock = counterpartyAnalysis.deadlock
  const [deadlockResults] = deadlock

  const recipient = recipientOnlyAnalysis || counterpartyAnalysis.recipient
  const contract = counterpartyAnalysis.contract
  const safeShieldTx = safeTx || safeTxContext.safeTx

  // Safe-level analysis: untrusted Safe check
  const { safeAnalysis, addToTrustedList } = useUntrustedSafeAnalysis()

  const [isRiskConfirmed, setIsRiskConfirmed] = useState(false)

  const { needsRiskConfirmation, primaryThreatSeverity } = useMemo(() => {
    const primaryThreatResult = getPrimaryResult(threatAnalysisResult?.THREAT || [])

    const severity = primaryThreatResult?.severity
    const hasCriticalThreat = isSeverityHigherOrEqual(severity, Severity.CRITICAL)

    const primaryDeadlockResult = getPrimaryResult(deadlockResults?.DEADLOCK || [])
    const deadlockSeverity = primaryDeadlockResult?.severity
    const hasCriticalDeadlock = isSeverityHigherOrEqual(deadlockSeverity, Severity.CRITICAL)

    // Include Safe-level analysis and deadlock in risk confirmation
    const needsRiskConfirmation =
      hasCriticalThreat || hasCriticalDeadlock || safeAnalysis?.severity === Severity.CRITICAL

    return {
      needsRiskConfirmation,
      primaryThreatSeverity: severity,
    }
  }, [threatAnalysisResult, deadlockResults, safeAnalysis])

  useEffect(() => {
    setIsRiskConfirmed(false)
  }, [primaryThreatSeverity, safeShieldTx, safeAnalysis, deadlockResults])

  return (
    <SafeShieldContext.Provider
      value={{
        setRecipientAddresses,
        setSafeTx,
        safeTx: safeShieldTx,
        recipient,
        contract,
        threat,
        deadlock,
        needsRiskConfirmation,
        isRiskConfirmed,
        setIsRiskConfirmed,
        safeAnalysis,
        addToTrustedList,
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
