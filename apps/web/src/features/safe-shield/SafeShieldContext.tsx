import {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  useMemo,
  type Dispatch,
  type SetStateAction,
} from 'react'
import { useCounterpartyAnalysis, useDeadlockAnalysis, useRecipientAnalysis, useThreatAnalysis } from './hooks'
import useUntrustedSafeAnalysis from './hooks/useUntrustedSafeAnalysis'
import { useEffectDeepCompare } from '@safe-global/utils/features/safe-shield/hooks/util-hooks'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import type { SafeTransaction } from '@safe-global/types-kit'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import {
  type ContractAnalysisResults,
  type ThreatAnalysisResults,
  type RecipientAnalysisResults,
  type SafeAnalysisResult,
  type DeadlockCheckResult,
  Severity,
} from '@safe-global/utils/features/safe-shield/types'
import { getPrimaryResult, SEVERITY_PRIORITY } from '@safe-global/utils/features/safe-shield/utils'
import { useAuthToken } from '@/features/hypernative'
import { trackEvent, SETTINGS_EVENTS } from '@/services/analytics'

type DeadlockCheckParams = {
  editedSafeAddress: string
  projectedOwners: string[]
  projectedThreshold: number
} | null

export type SafeShieldContextType = {
  setRecipientAddresses: Dispatch<SetStateAction<string[] | undefined>>
  setSafeTx: Dispatch<SetStateAction<SafeTransaction | undefined>>
  safeTx?: SafeTransaction
  recipient: AsyncResult<RecipientAnalysisResults>
  contract: AsyncResult<ContractAnalysisResults>
  threat: AsyncResult<ThreatAnalysisResults>
  deadlock: AsyncResult<DeadlockCheckResult>
  needsRiskConfirmation: boolean
  isRiskConfirmed: boolean
  setIsRiskConfirmed: Dispatch<SetStateAction<boolean>>
  // Safe-level analysis (untrusted Safe check)
  safeAnalysis: SafeAnalysisResult | null
  addToTrustedList: () => void
  setDeadlockCheckParams: Dispatch<SetStateAction<DeadlockCheckParams>>
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

  const recipient = recipientOnlyAnalysis || counterpartyAnalysis.recipient
  const contract = counterpartyAnalysis.contract
  const safeShieldTx = safeTx || safeTxContext.safeTx

  // Safe-level analysis: untrusted Safe check
  const { safeAnalysis, addToTrustedList } = useUntrustedSafeAnalysis()

  const [deadlockCheckParams, setDeadlockCheckParams] = useState<DeadlockCheckParams>(null)
  const deadlock = useDeadlockAnalysis(
    deadlockCheckParams?.editedSafeAddress,
    deadlockCheckParams?.projectedOwners,
    deadlockCheckParams?.projectedThreshold,
  )
  const [deadlockResult] = deadlock

  const [isRiskConfirmed, _setIsRiskConfirmed] = useState(false)

  const isDeadlockWarning = deadlockResult?.status === 'warning' || deadlockResult?.status === 'unknown'

  const setIsRiskConfirmed: Dispatch<SetStateAction<boolean>> = useCallback(
    (value) => {
      _setIsRiskConfirmed((prev) => {
        const next = typeof value === 'function' ? value(prev) : value
        if (next && !prev && isDeadlockWarning) {
          trackEvent(SETTINGS_EVENTS.DEADLOCK.WARNING_ACKNOWLEDGED)
        }
        return next
      })
    },
    [isDeadlockWarning],
  )

  const { needsRiskConfirmation, primaryThreatSeverity } = useMemo(() => {
    const primaryThreatResult = getPrimaryResult(threatAnalysisResult?.THREAT || [])

    const severity = primaryThreatResult?.severity
    const hasCriticalThreat = !!severity && SEVERITY_PRIORITY[severity] <= SEVERITY_PRIORITY[Severity.CRITICAL]
    const needsRiskConfirmation = hasCriticalThreat || safeAnalysis?.severity === Severity.CRITICAL || isDeadlockWarning

    return {
      needsRiskConfirmation,
      primaryThreatSeverity: severity,
    }
  }, [threatAnalysisResult, safeAnalysis, isDeadlockWarning])

  useEffect(() => {
    _setIsRiskConfirmed(false)
  }, [primaryThreatSeverity, safeShieldTx, safeAnalysis, deadlockResult?.status])

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
        setDeadlockCheckParams,
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

/**
 * Hook to register deadlock check params for Safe Shield analysis.
 * Called from Review components that know the projected owner state.
 */
export const useSafeShieldForDeadlockCheck = (
  editedSafeAddress: string,
  projectedOwners: string[],
  projectedThreshold: number,
) => {
  const { setDeadlockCheckParams } = useSafeShield()

  useEffectDeepCompare(() => {
    setDeadlockCheckParams({ editedSafeAddress, projectedOwners, projectedThreshold })

    return () => {
      setDeadlockCheckParams(null)
    }
  }, [editedSafeAddress, projectedOwners, projectedThreshold, setDeadlockCheckParams])
}
