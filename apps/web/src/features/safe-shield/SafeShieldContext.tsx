import {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  type ReactNode,
  useMemo,
  type Dispatch,
  type SetStateAction,
} from 'react'
import {
  useRecipientAnalysisWithPoisoning,
  useCounterpartyAnalysis,
  useRecipientAnalysis,
  useThreatAnalysis,
} from './hooks'
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
  StatusGroup,
} from '@safe-global/utils/features/safe-shield/types'
import { getPrimaryResult, isSeverityHigherOrEqual } from '@safe-global/utils/features/safe-shield/utils'
import { useAuthToken } from '@/features/hypernative'

type SafeShieldContextType = {
  setRecipientAddresses: Dispatch<SetStateAction<string[] | undefined>>
  setPoisoningAddresses: Dispatch<SetStateAction<string[] | undefined>>
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
  // Addresses registered for the poisoning check only (flows without recipient analysis)
  const [poisoningAddresses, setPoisoningAddresses] = useState<string[] | undefined>(undefined)
  const [safeTx, setSafeTx] = useState<SafeTransaction | undefined>(undefined)

  const recipientOnlyAnalysis = useRecipientAnalysis(recipientAddresses)
  const counterpartyAnalysis = useCounterpartyAnalysis(safeTx)
  const [{ token: hypernativeAuthToken }] = useAuthToken()

  const threat = useThreatAnalysis(safeTx, hypernativeAuthToken) ?? [undefined, undefined, false]
  const [threatAnalysisResult] = threat

  const deadlock = counterpartyAnalysis.deadlock
  const [deadlockResults] = deadlock

  // Add the address-poisoning check to the recipient analysis (create-step recipients + review-step
  // counterparty), plus poisoning-only entries for registered non-recipient addresses.
  const recipient = useRecipientAnalysisWithPoisoning(
    recipientOnlyAnalysis || counterpartyAnalysis.recipient,
    poisoningAddresses,
  )
  const [recipientData] = recipient

  // Any address-poisoning look-alike requires explicit risk confirmation
  const hasPoisoning = useMemo(
    () => Object.values(recipientData ?? {}).some((groups) => (groups[StatusGroup.ADDRESS_POISONING] ?? []).length > 0),
    [recipientData],
  )
  const contract = counterpartyAnalysis.contract
  const safeShieldTx = safeTx || safeTxContext.safeTx

  // Safe-level analysis: untrusted Safe check
  const { safeAnalysis, addToTrustedList } = useUntrustedSafeAnalysis()

  const [isRiskConfirmed, setIsRiskConfirmed] = useState(false)

  const { needsRiskConfirmation, primaryThreatSeverity } = useMemo(() => {
    const primaryThreatResult = getPrimaryResult(threatAnalysisResult?.THREAT || [])

    const severity = primaryThreatResult?.severity
    const hasCriticalThreat = isSeverityHigherOrEqual(severity, Severity.CRITICAL)

    // Flatten address-keyed deadlock results to find the highest severity across all Safes
    const allDeadlockResults = Object.values(deadlockResults || {}).flatMap((addr) => addr.DEADLOCK || [])
    const primaryDeadlockResult = getPrimaryResult(allDeadlockResults)
    const deadlockSeverity = primaryDeadlockResult?.severity
    const hasCriticalDeadlock = isSeverityHigherOrEqual(deadlockSeverity, Severity.CRITICAL)

    // Include Safe-level analysis, deadlock and address-poisoning in risk confirmation
    const needsRiskConfirmation =
      hasCriticalThreat || hasCriticalDeadlock || hasPoisoning || safeAnalysis?.severity === Severity.CRITICAL

    return {
      needsRiskConfirmation,
      primaryThreatSeverity: severity,
    }
  }, [threatAnalysisResult, deadlockResults, safeAnalysis, hasPoisoning])

  useEffect(() => {
    setIsRiskConfirmed(false)
  }, [primaryThreatSeverity, safeShieldTx, safeAnalysis, deadlockResults, hasPoisoning])

  return (
    <SafeShieldContext.Provider
      value={{
        setRecipientAddresses,
        setPoisoningAddresses,
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
 * Register addresses for the address-poisoning check only (no recipient analysis).
 *
 * For tx-flows whose address is not a transfer recipient (add owner, recovery setup,
 * spending-limit beneficiary, signers, …): a matched address surfaces in the Copilot recipient
 * card with just the ADDRESS_POISONING state.
 *
 * Keys on the joined VALUE, not array identity — RHF's watch() mutates its array in place, so a
 * value key is what makes the check re-trigger. (Do NOT key on the array reference / useMemoDeepCompare:
 * they compare by reference and would miss the in-place mutation.)
 * @param addresses - Addresses to check against the user's trusted anchors (undefined entries are dropped)
 */
export const useSafeShieldForAddressPoisoning = (addresses: Array<string | undefined>) => {
  const { setPoisoningAddresses, recipient } = useSafeShield()
  const key = addresses.filter(Boolean).join(',')

  useEffect(() => {
    setPoisoningAddresses(key ? key.split(',') : undefined)
  }, [key, setPoisoningAddresses])

  // Clear the registration when the owning flow unmounts, so a stale look-alike card can't linger
  // against addresses no current flow cares about if the provider outlives the flow.
  useEffect(() => () => setPoisoningAddresses(undefined), [setPoisoningAddresses])

  return recipient
}

/**
 * Hook to register transaction data for Safe Shield analysis
 * @param txData - Transaction data to analyze
 */
export const useSafeShieldForTxData = (txData: SafeTransaction | undefined) => {
  const { setSafeTx } = useSafeShield()

  // Callers may pass a freshly-constructed SafeTransaction every render (e.g. GTF's previewed tx).
  const lastDataKeyRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!txData) {
      if (lastDataKeyRef.current !== undefined) {
        lastDataKeyRef.current = undefined
        setSafeTx(undefined)
      }
      return
    }
    const key = JSON.stringify(txData.data)
    if (key === lastDataKeyRef.current) return
    lastDataKeyRef.current = key
    setSafeTx(txData)
  }, [txData, setSafeTx])
}
