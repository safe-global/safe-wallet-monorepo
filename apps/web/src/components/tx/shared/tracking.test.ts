import { trackTxEvents } from './tracking'
import { trackEvent, MixpanelEventParams } from '@/services/analytics'
import { TX_EVENTS, TX_TYPES } from '@/services/analytics/events/transactions'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
}))

const mockTrackEvent = trackEvent as jest.Mock

// Note: The "Execute" button in the queue (ExecuteTxButton) only tracks to GA via gtmTrack().
// Mixpanel events are sent here:
// - "Transaction Submitted" when isCreation = true (GRO-119)
// - "Transaction Executed" when isExecuted = true (GRO-120)
describe('trackTxEvents', () => {
  beforeEach(() => {
    mockTrackEvent.mockClear()
  })

  const baseDetails = {
    txInfo: {
      type: 'Transfer',
      transferInfo: {
        type: 'NATIVE_COIN',
        value: '1000000000000000000',
      },
    },
    txStatus: 'SUCCESS',
  } as unknown as TransactionDetails

  describe('when transaction is SUBMITTED (isCreation = true)', () => {
    it('should track creation event with Mixpanel properties including threshold', () => {
      trackTxEvents(
        baseDetails,
        true, // isCreation
        false, // isExecuted
        false, // isRoleExecution
        false, // isProposerCreation
        false, // isParentSigner
        undefined, // origin
        false, // isMassPayout
        2, // threshold
      )

      expect(mockTrackEvent).toHaveBeenCalledTimes(1)
      expect(mockTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: TX_EVENTS.CREATE.action,
        }),
        {
          [MixpanelEventParams.TRANSACTION_TYPE]: TX_TYPES.transfer_token,
          [MixpanelEventParams.THRESHOLD]: 2,
        },
      )
    })

    it('should track creation event without threshold if not provided', () => {
      trackTxEvents(
        baseDetails,
        true, // isCreation
        false, // isExecuted
        false, // isRoleExecution
        false, // isProposerCreation
        false, // isParentSigner
        undefined, // origin
        false, // isMassPayout
        undefined, // threshold
      )

      expect(mockTrackEvent).toHaveBeenCalledTimes(1)
      expect(mockTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: TX_EVENTS.CREATE.action,
        }),
        {
          [MixpanelEventParams.TRANSACTION_TYPE]: TX_TYPES.transfer_token,
        },
      )
    })

    it('should track both creation and execution when isCreation and isExecuted are both true', () => {
      trackTxEvents(
        baseDetails,
        true, // isCreation
        true, // isExecuted
        false, // isRoleExecution
        false, // isProposerCreation
        false, // isParentSigner
        undefined, // origin
        false, // isMassPayout
        1, // threshold
      )

      expect(mockTrackEvent).toHaveBeenCalledTimes(2)
      // First call: creation event with Mixpanel properties (Transaction Submitted)
      expect(mockTrackEvent).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          action: TX_EVENTS.CREATE.action,
        }),
        {
          [MixpanelEventParams.TRANSACTION_TYPE]: TX_TYPES.transfer_token,
          [MixpanelEventParams.THRESHOLD]: 1,
        },
      )
      // Second call: execution event with Mixpanel properties (Transaction Executed)
      expect(mockTrackEvent).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          action: TX_EVENTS.EXECUTE.action,
        }),
        {
          [MixpanelEventParams.TRANSACTION_TYPE]: TX_TYPES.transfer_token,
          [MixpanelEventParams.THRESHOLD]: 1,
        },
      )
    })
  })

  describe('when transaction is EXECUTED (isExecuted = true, isCreation = false)', () => {
    it('should track execution event with Mixpanel properties including threshold', () => {
      trackTxEvents(
        baseDetails,
        false, // isCreation
        true, // isExecuted
        false, // isRoleExecution
        false, // isProposerCreation
        false, // isParentSigner
        undefined, // origin
        false, // isMassPayout
        2, // threshold
      )

      expect(mockTrackEvent).toHaveBeenCalledTimes(1)
      expect(mockTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: TX_EVENTS.EXECUTE.action,
        }),
        {
          [MixpanelEventParams.TRANSACTION_TYPE]: TX_TYPES.transfer_token,
          [MixpanelEventParams.THRESHOLD]: 2,
        },
      )
    })

    it('should track execution event without threshold if not provided', () => {
      trackTxEvents(
        baseDetails,
        false, // isCreation
        true, // isExecuted
        false, // isRoleExecution
        false, // isProposerCreation
        false, // isParentSigner
        undefined, // origin
        false, // isMassPayout
        undefined, // threshold
      )

      expect(mockTrackEvent).toHaveBeenCalledTimes(1)
      expect(mockTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: TX_EVENTS.EXECUTE.action,
        }),
        {
          [MixpanelEventParams.TRANSACTION_TYPE]: TX_TYPES.transfer_token,
        },
      )
    })
  })

  describe('when transaction is CONFIRMED (isCreation = false, isExecuted = false)', () => {
    it('should track confirmation event without Mixpanel properties', () => {
      trackTxEvents(
        baseDetails,
        false, // isCreation
        false, // isExecuted
        false, // isRoleExecution
        false, // isProposerCreation
        false, // isParentSigner
        undefined, // origin
        false, // isMassPayout
        2, // threshold (should be ignored for confirmations)
      )

      expect(mockTrackEvent).toHaveBeenCalledTimes(1)
      expect(mockTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: TX_EVENTS.CONFIRM.action,
        }),
      )
      // Should NOT include Mixpanel properties for confirmation
      expect(mockTrackEvent).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          [MixpanelEventParams.THRESHOLD]: expect.anything(),
        }),
      )
    })
  })

  describe('creation variants (Transaction Submitted)', () => {
    it('should track CREATE_VIA_PARENT with Mixpanel properties when isParentSigner is true', () => {
      trackTxEvents(
        baseDetails,
        true, // isCreation
        false, // isExecuted
        false, // isRoleExecution
        false, // isProposerCreation
        true, // isParentSigner
        undefined, // origin
        false, // isMassPayout
        3, // threshold
      )

      expect(mockTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: TX_EVENTS.CREATE_VIA_PARENT.action,
        }),
        expect.objectContaining({
          [MixpanelEventParams.THRESHOLD]: 3,
          [MixpanelEventParams.TRANSACTION_TYPE]: TX_TYPES.transfer_token,
        }),
      )
    })

    it('should track CREATE_VIA_ROLE with Mixpanel properties when isRoleExecution is true', () => {
      trackTxEvents(
        baseDetails,
        true, // isCreation
        false, // isExecuted
        true, // isRoleExecution
        false, // isProposerCreation
        false, // isParentSigner
        undefined, // origin
        false, // isMassPayout
        1, // threshold
      )

      expect(mockTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: TX_EVENTS.CREATE_VIA_ROLE.action,
        }),
        expect.objectContaining({
          [MixpanelEventParams.THRESHOLD]: 1,
          [MixpanelEventParams.TRANSACTION_TYPE]: TX_TYPES.transfer_token,
        }),
      )
    })

    it('should track CREATE_VIA_PROPOSER with Mixpanel properties when isProposerCreation is true', () => {
      trackTxEvents(
        baseDetails,
        true, // isCreation
        false, // isExecuted
        false, // isRoleExecution
        true, // isProposerCreation
        false, // isParentSigner
        undefined, // origin
        false, // isMassPayout
        2, // threshold
      )

      expect(mockTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: TX_EVENTS.CREATE_VIA_PROPOSER.action,
        }),
        expect.objectContaining({
          [MixpanelEventParams.THRESHOLD]: 2,
          [MixpanelEventParams.TRANSACTION_TYPE]: TX_TYPES.transfer_token,
        }),
      )
    })
  })

  describe('execution variants (Transaction Executed)', () => {
    it('should track EXECUTE_VIA_PARENT with Mixpanel properties when isParentSigner is true', () => {
      trackTxEvents(
        baseDetails,
        false, // isCreation
        true, // isExecuted
        false, // isRoleExecution
        false, // isProposerCreation
        true, // isParentSigner
        undefined, // origin
        false, // isMassPayout
        3, // threshold
      )

      expect(mockTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: TX_EVENTS.EXECUTE_VIA_PARENT.action,
        }),
        expect.objectContaining({
          [MixpanelEventParams.THRESHOLD]: 3,
        }),
      )
    })

    it('should track EXECUTE_VIA_ROLE with Mixpanel properties when isRoleExecution is true', () => {
      trackTxEvents(
        baseDetails,
        false, // isCreation
        true, // isExecuted
        true, // isRoleExecution
        false, // isProposerCreation
        false, // isParentSigner
        undefined, // origin
        false, // isMassPayout
        1, // threshold
      )

      expect(mockTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: TX_EVENTS.EXECUTE_VIA_ROLE.action,
        }),
        expect.objectContaining({
          [MixpanelEventParams.THRESHOLD]: 1,
        }),
      )
    })
  })
})
