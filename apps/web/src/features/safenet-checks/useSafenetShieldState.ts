import { Severity } from '@safe-global/utils/features/safe-shield/types'
import { SEVERITY_TO_TITLE } from '@safe-global/utils/features/safe-shield/constants'
import { CheckStatus } from '@safe-global/utils/features/safenet-checks'
import type { SafenetCheckView } from '@safe-global/utils/features/safenet-checks/hooks'
import { rejectionSeverity, summariseRejection } from './summariseRejection'
import { useFlowSafenetCheck } from './useFlowSafenetCheck'

/** The Safenet row in the Safe Shield "N of M checks passed" count. */
export type SafenetCheckCount = { shown: boolean; passed: boolean }

/** The open transaction's Safenet check, as the Safe Shield header reads it. */
export type SafenetShieldState = {
  check: SafenetCheckCount
  risk: { severity: Severity; title: string } | undefined
}

// Shared instances keep the count's identity stable across renders.
const NOT_COUNTED: SafenetCheckCount = { shown: false, passed: false }
const NOT_PASSED: SafenetCheckCount = { shown: true, passed: false }
const PASSED: SafenetCheckCount = { shown: true, passed: true }

const OFF: SafenetShieldState = { check: NOT_COUNTED, risk: undefined }
// A locked row counts as a check that never passes, like the other locked Pro rows.
const LOCKED: SafenetShieldState = { ...OFF, check: NOT_PASSED }

type RiskSeverity = Severity.CRITICAL | Severity.WARN
const RISK: Record<RiskSeverity, NonNullable<SafenetShieldState['risk']>> = {
  [Severity.CRITICAL]: { severity: Severity.CRITICAL, title: SEVERITY_TO_TITLE[Severity.CRITICAL] },
  [Severity.WARN]: { severity: Severity.WARN, title: SEVERITY_TO_TITLE[Severity.WARN] },
}

type ShieldCheck = Pick<SafenetCheckView, 'publicStatus' | 'snapshot'>

// A risk reads as severe as the rules sentinels cited; without them it stays a threat.
const riskOf = ({ publicStatus, snapshot }: ShieldCheck): SafenetShieldState['risk'] => {
  if (publicStatus !== CheckStatus.MALICIOUS) return undefined
  return RISK[snapshot ? rejectionSeverity(summariseRejection(snapshot.events)) : Severity.CRITICAL]
}

// UNAVAILABLE states carry no verdict, so they stay out of the count.
const fromCheck = (check: ShieldCheck): SafenetShieldState => ({
  check:
    check.publicStatus === CheckStatus.UNAVAILABLE
      ? NOT_COUNTED
      : check.publicStatus === CheckStatus.BENIGN
        ? PASSED
        : NOT_PASSED,
  risk: riskOf(check),
})

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
  const { safeTxHash, check } = useFlowSafenetCheck(isOpen)

  if (!isOpen) return enabled ? LOCKED : OFF
  if (!safeTxHash) return OFF

  return fromCheck(check)
}
