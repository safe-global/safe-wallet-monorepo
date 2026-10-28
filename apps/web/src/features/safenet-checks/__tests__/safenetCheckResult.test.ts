import {
  CheckEventType,
  CheckStatus,
  type InconclusiveEvent,
  type PublicCheckStatus,
  type UnavailableReason,
} from '@safe-global/utils/features/safenet-checks'
import { arbitrationTimedOutEvent } from '@safe-global/utils/features/safenet-checks/builders'
import { SafenetCheckResult as Result } from '@/services/analytics/mixpanel-events'
import { toSafenetCheckResult } from '../safenetCheckResult'

const { BENIGN, MALICIOUS, DISPUTED, TIMED_OUT, UNAVAILABLE, SUBMITTED, IN_PROGRESS } = CheckStatus
const { ARBITRATION_TIMED_OUT, DISPUTE_OUT_OF_SCOPE, REQUEST_TIMED_OUT } = CheckEventType

describe('toSafenetCheckResult', () => {
  it.each<
    [PublicCheckStatus, UnavailableReason | undefined, InconclusiveEvent['type'] | undefined, Result | undefined]
  >([
    [BENIGN, undefined, undefined, Result.NO_ISSUES],
    [MALICIOUS, undefined, undefined, Result.RISK_DETECTED],
    [DISPUTED, undefined, undefined, Result.NO_RULING],
    [TIMED_OUT, undefined, ARBITRATION_TIMED_OUT, Result.NO_RULING],
    [TIMED_OUT, undefined, DISPUTE_OUT_OF_SCOPE, Result.NO_RULING],
    [TIMED_OUT, undefined, REQUEST_TIMED_OUT, Result.UNAVAILABLE],
    [UNAVAILABLE, 'READ_FAILED', undefined, Result.UNAVAILABLE],
    [UNAVAILABLE, 'WINDOW_UNCERTAIN', undefined, Result.UNAVAILABLE],
    [UNAVAILABLE, 'NO_CHECK', undefined, undefined],
    [UNAVAILABLE, undefined, undefined, undefined],
    [SUBMITTED, undefined, undefined, undefined],
    [IN_PROGRESS, undefined, undefined, undefined],
  ])('maps %s with reason %s and event %s to %s', (status, reason, eventType, expected) => {
    const events = eventType ? [arbitrationTimedOutEvent({ type: eventType })] : []

    expect(toSafenetCheckResult(status, reason, events)).toBe(expected)
  })
})
