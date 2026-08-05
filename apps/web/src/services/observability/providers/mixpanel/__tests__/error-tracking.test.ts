import { trackErrorSurfaced } from '../error-tracking'
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
})
