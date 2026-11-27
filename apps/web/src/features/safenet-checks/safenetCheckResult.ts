import {
  CheckEventType,
  CheckStatus,
  type NormalizedCheckEvent,
  type PublicCheckStatus,
  type UnavailableReason,
} from '@safe-global/utils/features/safenet-checks'
import { SafenetCheckResult } from '@/services/analytics/mixpanel-events'

const NO_RULING_EVENTS = [CheckEventType.ARBITRATION_TIMED_OUT, CheckEventType.DISPUTE_OUT_OF_SCOPE]

const timedOutResult = (events: ReadonlyArray<NormalizedCheckEvent>): SafenetCheckResult =>
  events.some(({ type }) => NO_RULING_EVENTS.includes(type))
    ? SafenetCheckResult.NO_RULING
    : SafenetCheckResult.UNAVAILABLE

const unavailableResult = (reason: UnavailableReason | undefined): SafenetCheckResult | undefined =>
  reason === 'READ_FAILED' || reason === 'WINDOW_UNCERTAIN' ? SafenetCheckResult.UNAVAILABLE : undefined

export const toSafenetCheckResult = (
  publicStatus: PublicCheckStatus,
  unavailableReason: UnavailableReason | undefined,
  events: ReadonlyArray<NormalizedCheckEvent>,
): SafenetCheckResult | undefined => {
  switch (publicStatus) {
    case CheckStatus.BENIGN:
      return SafenetCheckResult.NO_ISSUES
    case CheckStatus.MALICIOUS:
      return SafenetCheckResult.RISK_DETECTED
    case CheckStatus.DISPUTED:
      return SafenetCheckResult.NO_RULING
    case CheckStatus.TIMED_OUT:
      return timedOutResult(events)
    case CheckStatus.UNAVAILABLE:
      return unavailableResult(unavailableReason)
    case CheckStatus.SUBMITTED:
    case CheckStatus.IN_PROGRESS:
      return undefined
    default: {
      const _exhaustive: never = publicStatus
      return _exhaustive
    }
  }
}
