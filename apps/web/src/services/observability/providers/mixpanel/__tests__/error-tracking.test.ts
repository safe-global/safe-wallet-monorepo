import { trackErrorSurfaced, __resetErrorSurfacedDedupeForTests } from '../error-tracking'
import { MixpanelEvent, MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { mixpanelTrack } from '@/services/analytics/mixpanel'
import { ErrorDomain, ErrorLayer, ErrorType } from '@safe-global/utils/services/exceptions/errorTaxonomy'

jest.mock('@/services/analytics/mixpanel', () => ({
  mixpanelTrack: jest.fn(),
}))

const mockedTrack = mixpanelTrack as jest.MockedFunction<typeof mixpanelTrack>

describe('trackErrorSurfaced', () => {
  beforeEach(() => {
    mockedTrack.mockClear()
    __resetErrorSurfacedDedupeForTests()
  })

  it('emits the Error Surfaced event with the normalized taxonomy', () => {
    trackErrorSurfaced({ code: 804, message: 'Code 804: Error executing a transaction', isUserFacing: true })

    expect(mockedTrack).toHaveBeenCalledTimes(1)
    const [eventName, props] = mockedTrack.mock.calls[0]
    expect(eventName).toBe(MixpanelEvent.ERROR_SURFACED)
    expect(props).toMatchObject({
      [MixpanelEventParams.ERROR_DOMAIN]: ErrorDomain.TX_EXECUTION,
      [MixpanelEventParams.ERROR_TYPE]: ErrorType.TX_EXECUTION_FAILED,
      [MixpanelEventParams.ERROR_LAYER]: ErrorLayer.OFF_CHAIN,
      [MixpanelEventParams.ERROR_CODE]: '804',
      [MixpanelEventParams.IS_USER_FACING]: true,
    })
  })

  it('never sends the raw or sanitized message to Mixpanel (enums only)', () => {
    trackErrorSurfaced({
      code: 804,
      message: 'Code 804: failed for 0x1234567890abcdef1234567890ABCDEF12345678',
      isUserFacing: true,
    })

    const serialized = JSON.stringify(mockedTrack.mock.calls[0][1])
    expect(serialized).not.toContain('0x1234567890abcdef1234567890ABCDEF12345678')
    expect(serialized).not.toContain('failed for')
    expect(serialized).not.toContain('[redacted]')
  })

  it('maps call-site context (txHash, target contract, tx type) to Mixpanel properties', () => {
    trackErrorSurfaced({
      code: 804,
      message: 'Code 804: revert',
      isUserFacing: true,
      context: {
        txHash: '0xabc123',
        targetContractLabel: 'Uniswap V3 Router',
        transactionType: 'swap',
      },
    })

    expect(mockedTrack.mock.calls[0][1]).toMatchObject({
      [MixpanelEventParams.TX_HASH]: '0xabc123',
      [MixpanelEventParams.TARGET_CONTRACT_LABEL]: 'Uniswap V3 Router',
      [MixpanelEventParams.TRANSACTION_TYPE]: 'swap',
    })
  })

  it('maps the HTTP status context to a Mixpanel property', () => {
    trackErrorSurfaced({
      code: 805,
      message: 'Code 805: Error proposing (CGW error - 422: Invalid transaction)',
      isUserFacing: true,
      context: { httpStatus: 422 },
    })

    expect(mockedTrack.mock.calls[0][1]).toMatchObject({
      [MixpanelEventParams.HTTP_STATUS]: 422,
    })
  })

  it('maps RPC endpoint context (kind + host) to Mixpanel properties', () => {
    trackErrorSurfaced({
      code: 105,
      message: 'Code 105: Error connecting to the blockchain',
      isUserFacing: true,
      context: { rpcEndpointKind: 'infura', rpcHost: 'mainnet.infura.io' },
    })

    expect(mockedTrack.mock.calls[0][1]).toMatchObject({
      [MixpanelEventParams.RPC_ENDPOINT_KIND]: 'infura',
      [MixpanelEventParams.RPC_HOST]: 'mainnet.infura.io',
      [MixpanelEventParams.ERROR_DOMAIN]: ErrorDomain.RPC,
    })
  })

  it('omits context keys that are not provided', () => {
    trackErrorSurfaced({ code: 804, message: 'Code 804: revert', isUserFacing: true, context: { txHash: '0xabc' } })

    const props = mockedTrack.mock.calls[0][1] ?? {}
    expect(props).toHaveProperty(MixpanelEventParams.TX_HASH, '0xabc')
    expect(props).not.toHaveProperty(MixpanelEventParams.TARGET_CONTRACT_LABEL)
  })

  it('marks background (logged) errors as not user facing', () => {
    trackErrorSurfaced({ code: 601, message: 'Code 601: Error fetching balances', isUserFacing: false })

    expect(mockedTrack.mock.calls[0][1]).toMatchObject({
      [MixpanelEventParams.IS_USER_FACING]: false,
      [MixpanelEventParams.ERROR_DOMAIN]: ErrorDomain.DATA_LOADING,
    })
  })

  describe('user-driven outcomes (WA-2950)', () => {
    it.each([
      'Code 804: Error executing a transaction (user rejected the request)',
      'Code 804: Error executing a transaction (Rejected)',
      'Request expired. Please try again.',
      'Proposal expired',
    ])('does not emit Error Surfaced for %p', (message) => {
      trackErrorSurfaced({ code: 804, message, isUserFacing: true })

      expect(mockedTrack).not.toHaveBeenCalled()
    })

    it('still emits Error Surfaced for a genuine execution failure', () => {
      trackErrorSurfaced({ code: 804, message: 'Code 804: execution reverted GS013', isUserFacing: true })

      expect(mockedTrack).toHaveBeenCalledTimes(1)
    })
  })

  describe('pre-execution predictions (the "will most likely fail" warning)', () => {
    it('does not emit Error Surfaced for an estimation the node says reverts', () => {
      trackErrorSurfaced({
        code: 612,
        message: 'Code 612: Error estimating gas (execution reverted: GS013)',
        isUserFacing: false,
      })

      expect(mockedTrack).not.toHaveBeenCalled()
    })

    it('does not emit Error Surfaced for a custom-error revert without a GS code', () => {
      trackErrorSurfaced({
        code: 612,
        message: 'Code 612: Error estimating gas (execution reverted, unknown custom error)',
        isUserFacing: false,
      })

      expect(mockedTrack).not.toHaveBeenCalled()
    })

    it('still emits Error Surfaced when the estimation failed because the node was unreachable', () => {
      trackErrorSurfaced({
        code: 612,
        message: 'Code 612: Error estimating gas (missing response)',
        isUserFacing: false,
        context: { rpcHost: 'mainnet.infura.io' },
      })

      expect(mockedTrack).toHaveBeenCalledTimes(1)
      expect(mockedTrack.mock.calls[0][1]).toMatchObject({
        [MixpanelEventParams.ERROR_DOMAIN]: ErrorDomain.RPC,
        [MixpanelEventParams.ERROR_TYPE]: ErrorType.GAS_ESTIMATION_FAILED,
      })
    })

    it('still emits Error Surfaced when the user executes and it reverts on chain', () => {
      trackErrorSurfaced({ code: 804, message: 'Code 804: execution reverted GS013', isUserFacing: true })

      expect(mockedTrack).toHaveBeenCalledTimes(1)
      expect(mockedTrack.mock.calls[0][1]).toMatchObject({
        [MixpanelEventParams.ERROR_CODE]: 'GS013',
      })
    })
  })

  describe('retry attempts', () => {
    it('emits the attempt number and flags it as a retry when it is not the first', () => {
      trackErrorSurfaced({
        code: 650,
        message: 'Code 650: Error syncing counterfactual safes',
        isUserFacing: false,
        context: { attempt: 2 },
      })

      expect(mockedTrack.mock.calls[0][1]).toMatchObject({
        [MixpanelEventParams.ERROR_ATTEMPT]: 2,
        [MixpanelEventParams.IS_RETRY]: true,
      })
    })

    it('emits the first attempt with the retry flag off', () => {
      trackErrorSurfaced({
        code: 650,
        message: 'Code 650: Error syncing counterfactual safes',
        isUserFacing: false,
        context: { attempt: 1 },
      })

      expect(mockedTrack.mock.calls[0][1]).toMatchObject({
        [MixpanelEventParams.ERROR_ATTEMPT]: 1,
        [MixpanelEventParams.IS_RETRY]: false,
      })
    })

    it('omits both properties entirely when the call site does not report an attempt', () => {
      trackErrorSurfaced({ code: 650, message: 'Code 650: Error syncing', isUserFacing: false })

      const props = mockedTrack.mock.calls[0][1] ?? {}
      expect(props).not.toHaveProperty(MixpanelEventParams.ERROR_ATTEMPT)
      expect(props).not.toHaveProperty(MixpanelEventParams.IS_RETRY)
    })
  })

  describe('deduplication', () => {
    const DEDUPE_WINDOW_MS = 60_000
    const START = 1_700_000_000_000

    let now: number

    beforeEach(() => {
      now = START
      jest.spyOn(Date, 'now').mockImplementation(() => now)
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    const trackPollFailure = (context?: Parameters<typeof trackErrorSurfaced>[0]['context']) =>
      trackErrorSurfaced({ code: 600, message: 'Code 600: Error fetching safe info', isUserFacing: false, context })

    it('emits an identical error only once inside the cooldown window', () => {
      trackPollFailure()
      now += 15_000
      trackPollFailure()
      now += 15_000
      trackPollFailure()

      expect(mockedTrack).toHaveBeenCalledTimes(1)
    })

    it('reports a single occurrence on the first send', () => {
      trackPollFailure()

      expect(mockedTrack.mock.calls[0][1]).toMatchObject({
        [MixpanelEventParams.ERROR_OCCURRENCES]: 1,
      })
    })

    it('re-emits after the window, carrying the occurrences it collapsed', () => {
      trackPollFailure()
      now += 15_000
      trackPollFailure()
      now += 15_000
      trackPollFailure()

      now = START + DEDUPE_WINDOW_MS
      trackPollFailure()

      expect(mockedTrack).toHaveBeenCalledTimes(2)
      // The two suppressed repeats plus this occurrence, so summing the
      // property still yields the true total of four.
      expect(mockedTrack.mock.calls[1][1]).toMatchObject({
        [MixpanelEventParams.ERROR_OCCURRENCES]: 3,
      })
    })

    describe('trailing occurrences', () => {
      // The count used to be carried out only by the *next* occurrence, so a
      // user who retried a failing action twice inside the window and then gave
      // up had those two retries dropped when the entry expired.
      beforeEach(() => {
        jest.useFakeTimers()
      })

      afterEach(() => {
        jest.runOnlyPendingTimers()
        jest.useRealTimers()
      })

      it('flushes what it collapsed when the failure stops recurring', () => {
        trackPollFailure()
        now += 15_000
        trackPollFailure()
        now += 15_000
        trackPollFailure()

        expect(mockedTrack).toHaveBeenCalledTimes(1)

        now = START + DEDUPE_WINDOW_MS
        jest.advanceTimersByTime(DEDUPE_WINDOW_MS)

        expect(mockedTrack).toHaveBeenCalledTimes(2)
        // 1 emitted + 2 flushed = the three occurrences that really happened.
        expect(mockedTrack.mock.calls[1][1]).toMatchObject({
          [MixpanelEventParams.ERROR_OCCURRENCES]: 2,
        })
      })

      it('emits nothing extra when nothing was collapsed', () => {
        trackPollFailure()

        jest.advanceTimersByTime(DEDUPE_WINDOW_MS)

        expect(mockedTrack).toHaveBeenCalledTimes(1)
      })

      it('keeps the taxonomy of the error it stands for', () => {
        trackPollFailure()
        now += 15_000
        trackPollFailure()

        now = START + DEDUPE_WINDOW_MS
        jest.advanceTimersByTime(DEDUPE_WINDOW_MS)

        const [, flushed] = mockedTrack.mock.calls[1]
        expect(flushed).toMatchObject(
          Object.fromEntries(
            Object.entries(mockedTrack.mock.calls[0][1] as Record<string, unknown>).filter(
              ([key]) => key !== MixpanelEventParams.ERROR_OCCURRENCES,
            ),
          ),
        )
      })
    })

    it('does not suppress a different taxonomy', () => {
      trackPollFailure()
      trackErrorSurfaced({ code: 804, message: 'Code 804: execution reverted GS013', isUserFacing: true })

      expect(mockedTrack).toHaveBeenCalledTimes(2)
    })

    it('does not suppress the same error reported for a different attempt', () => {
      trackErrorSurfaced({
        code: 650,
        message: 'Code 650: Error syncing',
        isUserFacing: false,
        context: { attempt: 1 },
      })
      now += 2_000
      trackErrorSurfaced({
        code: 650,
        message: 'Code 650: Error syncing',
        isUserFacing: false,
        context: { attempt: 2 },
      })

      expect(mockedTrack).toHaveBeenCalledTimes(2)
      expect(mockedTrack.mock.calls[0][1]).toMatchObject({ [MixpanelEventParams.ERROR_ATTEMPT]: 1 })
      expect(mockedTrack.mock.calls[1][1]).toMatchObject({ [MixpanelEventParams.ERROR_ATTEMPT]: 2 })
    })

    it('does not suppress the same error reported against a different context facet', () => {
      trackPollFailure({ httpStatus: 500 })
      trackPollFailure({ httpStatus: 503 })

      expect(mockedTrack).toHaveBeenCalledTimes(2)
    })

    it('leaves no dedupe entry for a user-driven outcome', () => {
      trackErrorSurfaced({
        code: 804,
        message: 'Code 804: Error executing (user rejected the request)',
        isUserFacing: true,
      })
      trackErrorSurfaced({ code: 804, message: 'Code 804: execution reverted GS013', isUserFacing: true })

      expect(mockedTrack).toHaveBeenCalledTimes(1)
    })

    it('bounds the tracked keys, evicting the least recently sent', () => {
      const distinctErrors = 600
      for (let i = 0; i < distinctErrors; i++) {
        trackPollFailure({ txHash: `0x${i}` })
      }
      expect(mockedTrack).toHaveBeenCalledTimes(distinctErrors)

      mockedTrack.mockClear()

      // The oldest key was evicted to keep the map bounded, so it is emitted
      // again despite still being inside its window; a recent one is not.
      trackPollFailure({ txHash: '0x0' })
      trackPollFailure({ txHash: `0x${distinctErrors - 1}` })

      expect(mockedTrack).toHaveBeenCalledTimes(1)
      expect(mockedTrack.mock.calls[0][1]).toMatchObject({ [MixpanelEventParams.TX_HASH]: '0x0' })
    })
  })
})
