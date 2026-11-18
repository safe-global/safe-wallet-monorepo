import { useCallback, useContext, useState, type ReactNode, useMemo, type Dispatch, type SetStateAction } from 'react'
import { useRecipientAnalysisWithPoisoning } from '../hooks/useRecipientAnalysisWithPoisoning'
import { useCounterpartyAnalysis } from '../hooks/useCounterpartyAnalysis'
import { useRecipientAnalysis } from '../hooks/useRecipientAnalysis'
import { useThreatAnalysis } from '../hooks/useThreatAnalysis'
import useUntrustedSafeAnalysis from '../hooks/useUntrustedSafeAnalysis'
import type { SafeTransaction } from '@safe-global/types-kit'
import { SafeShieldContext } from './useSafeShield'
import { SafeTxContext } from '@safe-global/views/components/tx-flow/SafeTxContext'
import {
  type ThreatAnalysisResults,
  type DeadlockAnalysisResults,
  type SafeAnalysisResult,
  Severity,
  StatusGroup,
} from '@safe-global/utils/features/safe-shield/types'
import { getPrimaryResult, isSeverityHigherOrEqual } from '@safe-global/utils/features/safe-shield/utils'
import { useAuthToken } from '@/features/hypernative/public/useAuthToken'
import { useSafeScopeContext } from '@safe-global/views/components/tx-flow/safe-scope/context'
import { useSafeProAccess } from '@/features/spaces/public/useSafeProAccess'

const isCritical = <T extends { severity: Severity }>(result: T | null | undefined): result is T =>
  isSeverityHigherOrEqual(result?.severity, Severity.CRITICAL)

type RiskAnalyses = {
  threat: ThreatAnalysisResults | undefined
  deadlock: DeadlockAnalysisResults | undefined
  hasPoisoning: boolean
  safeAnalysis: SafeAnalysisResult | null
}

/** The findings that need the user's risk confirmation, as stable keys. */
function criticalFindingsOf({ threat, deadlock, hasPoisoning, safeAnalysis }: RiskAnalyses): string[] {
  const primaryThreat = getPrimaryResult(threat?.THREAT || [])
  // Deadlock results are keyed by Safe address; the highest severity across all of them counts.
  const primaryDeadlock = getPrimaryResult(Object.values(deadlock || {}).flatMap((safe) => safe.DEADLOCK || []))

  const findings: string[] = []
  if (isCritical(primaryThreat)) findings.push(`threat:${primaryThreat.type}`)
  if (isCritical(primaryDeadlock)) findings.push(`deadlock:${primaryDeadlock.type}`)
  if (hasPoisoning) findings.push('address-poisoning')
  if (isCritical(safeAnalysis)) findings.push(`safe:${safeAnalysis.type}`)
  return findings
}

export const SafeShieldProvider = ({ children }: { children: ReactNode }) => {
  const safeTxContext = useContext(SafeTxContext)
  const [recipientAddresses, setRecipientAddresses] = useState<string[] | undefined>(undefined)
  // Addresses registered for the poisoning check only (flows without recipient analysis)
  const [poisoningAddresses, setPoisoningAddresses] = useState<string[] | undefined>(undefined)
  const [safeTx, setSafeTx] = useState<SafeTransaction | undefined>(undefined)

  const { hasProFeatures: hasProAccess, isSafePro } = useSafeProAccess()
  const scopeContext = useSafeScopeContext()
  // A Workspace-level flow picks its Safe in step 1; until then nothing can be checked, so nothing is locked.
  const isPickingSafe = scopeContext !== undefined && scopeContext.scope === undefined
  const hasProFeatures = hasProAccess || isPickingSafe
  const recipientOnlyAnalysis = useRecipientAnalysis(hasProFeatures ? recipientAddresses : undefined)
  const counterpartyAnalysis = useCounterpartyAnalysis(safeTx, hasProFeatures)
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
  const isOffchainMessage = !safeShieldTx && !!safeTxContext.safeMessage
  const safeShieldTxKey = safeShieldTx ? JSON.stringify(safeShieldTx.data).toLowerCase() : undefined

  // Safe-level analysis: untrusted Safe check
  const { safeAnalysis, addToTrustedList } = useUntrustedSafeAnalysis()

  const criticalFindings = useMemo(
    () => criticalFindingsOf({ threat: threatAnalysisResult, deadlock: deadlockResults, hasPoisoning, safeAnalysis }),
    [threatAnalysisResult, deadlockResults, hasPoisoning, safeAnalysis],
  )
  const needsRiskConfirmation = criticalFindings.length > 0

  // A confirmation covers one transaction with one set of critical findings; any change asks again.
  const riskKey = JSON.stringify([safeShieldTxKey, criticalFindings])
  const [confirmedRiskKey, setConfirmedRiskKey] = useState<string>()
  const isRiskConfirmed = confirmedRiskKey === riskKey
  const setIsRiskConfirmed = useCallback<Dispatch<SetStateAction<boolean>>>(
    (value) =>
      setConfirmedRiskKey((confirmedKey) => {
        const confirmed = typeof value === 'function' ? value(confirmedKey === riskKey) : value
        return confirmed ? riskKey : undefined
      }),
    [riskKey],
  )

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
        hasProFeatures,
        isSafePro,
        isOffchainMessage,
      }}
    >
      {children}
    </SafeShieldContext.Provider>
  )
}
