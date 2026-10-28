import { openDisputeRequestIds, rulingEventFor } from '../openDispute'
import {
  disputeResolvedEvent,
  disputeTriggeredEvent,
  requestCreatedEvent,
  sentinelRevealedEvent,
} from '../../builders/checkEvents'
import { CheckEventType, DisputeOutcome, OracleRequestState, type Hex } from '../../types'

const REQUEST_ID = `0x${'ab'.repeat(32)}` as Hex

describe('openDisputeRequestIds', () => {
  it('lists each triggered request once', () => {
    const events = [
      disputeTriggeredEvent({ requestId: REQUEST_ID }),
      disputeTriggeredEvent({ requestId: REQUEST_ID }),
      sentinelRevealedEvent(),
    ]
    expect(openDisputeRequestIds(events)).toEqual([REQUEST_ID])
  })

  it('is empty without a triggered dispute', () => {
    expect(openDisputeRequestIds([requestCreatedEvent(), sentinelRevealedEvent()])).toEqual([])
  })

  it.each([
    CheckEventType.DISPUTE_RESOLVED,
    CheckEventType.ARBITRATION_TIMED_OUT,
    CheckEventType.DISPUTE_OUT_OF_SCOPE,
  ] as const)('is empty once %s closes the dispute', (type) => {
    const closing = { ...disputeResolvedEvent(), type }
    expect(openDisputeRequestIds([disputeTriggeredEvent({ requestId: REQUEST_ID }), closing])).toEqual([])
  })
})

describe('rulingEventFor', () => {
  it.each([
    [OracleRequestState.RESOLVED_APPROVED, DisputeOutcome.RESOLVED_APPROVED],
    [OracleRequestState.RESOLVED_DENIED, DisputeOutcome.RESOLVED_DENIED],
  ])('turns state %s into a DisputeResolved with outcome %s', (state, outcome) => {
    expect(rulingEventFor(REQUEST_ID, state, 500)).toMatchObject({
      type: CheckEventType.DISPUTE_RESOLVED,
      requestId: REQUEST_ID,
      outcome,
      blockNumber: 500,
    })
  })

  it('turns TIMED_OUT into an ArbitrationTimedOut', () => {
    expect(rulingEventFor(REQUEST_ID, OracleRequestState.TIMED_OUT, 500)).toMatchObject({
      type: CheckEventType.ARBITRATION_TIMED_OUT,
      requestId: REQUEST_ID,
    })
  })

  it.each([OracleRequestState.NONE, OracleRequestState.PENDING, OracleRequestState.FROZEN])(
    'returns no event for the open state %s',
    (state) => {
      expect(rulingEventFor(REQUEST_ID, state, 500)).toBeNull()
    },
  )
})
