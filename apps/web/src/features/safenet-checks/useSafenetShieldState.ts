import type { Severity } from '@safe-global/utils/features/safe-shield/types'
import { CheckStatus, type PublicCheckStatus } from '@safe-global/utils/features/safenet-checks'
import { STATUS_PRESENTATION } from './statusPresentation'
import { useFlowSafenetCheck } from './useFlowSafenetCheck'

/** The Safenet row in the Safe Shield "N of M checks passed" count. */
export type SafenetCheckCount = { shown: boolean; passed: boolean }

/** The open transaction's Safenet check, as the Safe Shield header and badge read it. */
export type SafenetShieldState = {
  check: SafenetCheckCount
  /** No verdict yet: the transaction details, the first chain read or the check itself is in flight. */
  isRunning: boolean
  isBenign: boolean
  risk: { severity: Severity; title: string } | undefined
}

// Shared instances keep the count's identity stable across renders.
const NOT_COUNTED: SafenetCheckCount = { shown: false, passed: false }
const NOT_PASSED: SafenetCheckCount = { shown: true, passed: false }
const PASSED: SafenetCheckCount = { shown: true, passed: true }

const OFF: SafenetShieldState = { check: NOT_COUNTED, isRunning: false, isBenign: false, risk: undefined }
// A locked row counts as a check that never passes, like the other locked Pro rows.
const LOCKED: SafenetShieldState = { ...OFF, check: NOT_PASSED }

const { severity: riskSeverity, label: riskTitle } = STATUS_PRESENTATION[CheckStatus.MALICIOUS]
const RISK = { severity: riskSeverity, title: riskTitle }

// UNAVAILABLE states carry no verdict, so they stay out of the count.
const fromCheck = (publicStatus: PublicCheckStatus, isReading: boolean): SafenetShieldState => {
  const isBenign = publicStatus === CheckStatus.BENIGN
  const isInFlight = publicStatus === CheckStatus.SUBMITTED || publicStatus === CheckStatus.IN_PROGRESS
  return {
    check: publicStatus === CheckStatus.UNAVAILABLE ? NOT_COUNTED : isBenign ? PASSED : NOT_PASSED,
    isRunning: isReading || isInFlight,
    isBenign,
    risk: publicStatus === CheckStatus.MALICIOUS ? RISK : undefined,
  }
}

/** Safenet reads in the open list while SAFE_PRO is off, and in the Pro block only with Pro features. */
export const useSafenetShieldState = ({
  enabled,
  isSafePro,
  hasProFeatures,
}: {
  enabled: boolean
  isSafePro: boolean
  hasProFeatures: boolean
}): SafenetShieldState => {
  const isOpen = enabled && (!isSafePro || hasProFeatures)
  const { safeTxHash, submittedAt, isTxDetailsLoading, check } = useFlowSafenetCheck(isOpen)

  if (!isOpen) return enabled ? LOCKED : OFF
  if (!safeTxHash) return OFF

  return fromCheck(check.publicStatus, check.isLoading || (submittedAt === undefined && isTxDetailsLoading))
}
