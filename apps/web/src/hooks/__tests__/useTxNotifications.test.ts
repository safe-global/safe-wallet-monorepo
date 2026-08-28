import { act } from 'react'
import { renderHook, waitFor } from '@/tests/test-utils'
import { BaseError } from 'viem'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { RATE_LIMIT_USER_MESSAGE } from '@/utils/transaction-errors'
import { CGW_ERROR_FALLBACK } from '@safe-global/utils/services/exceptions/gatewayErrors'
import useTxNotifications from '../useTxNotifications'
import { showNotification } from '@/store/notificationsSlice'
import { TxEvent, txDispatch } from '@/services/tx/txEvents'
import { chainBuilder } from '@/tests/builders/chains'

const chain = chainBuilder().with({ chainId: '11155111', chainName: 'Sepolia' }).build()

jest.mock('@/store/notificationsSlice', () => {
  const original = jest.requireActual('@/store/notificationsSlice')
  return {
    ...original,
    showNotification: jest.fn(original.showNotification),
  }
})

jest.mock('../useChains', () => ({
  __esModule: true,
  useCurrentChain: jest.fn(() => chain),
  default: jest.fn(),
}))

jest.mock('../useTxQueue', () => ({
  __esModule: true,
  default: jest.fn(() => ({ page: undefined })),
}))

jest.mock('../useIsSafeOwner', () => ({
  __esModule: true,
  default: jest.fn(() => false),
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/transactions', () => ({
  ...jest.requireActual('@safe-global/store/gateway/AUTO_GENERATED/transactions'),
  useLazyTransactionsGetTransactionByIdV1Query: jest.fn(() => [jest.fn(() => Promise.resolve({ data: undefined }))]),
}))

const HTML_502 =
  '<html><head><title>502 Bad Gateway</title></head><body><center><h1>502 Bad Gateway</h1></center><hr><center>nginx</center></body></html>'

const lastNotification = () => {
  const calls = (showNotification as unknown as jest.Mock).mock.calls
  return calls[calls.length - 1][0]
}

describe('useTxNotifications — CGW response states (WA-3252)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const dispatchProposeFailure = async (error: Error) => {
    renderHook(() => useTxNotifications())

    act(() => {
      txDispatch(TxEvent.PROPOSE_FAILED, { error })
    })

    await waitFor(() => expect(showNotification).toHaveBeenCalled())
  }

  it.each([429, 502, 500, 503, 422])('shows the agreed copy for a %s from CGW', async (status) => {
    await dispatchProposeFailure(asError({ status, data: {} }))

    expect(lastNotification().message).toBe('Something went wrong on our end. Try again.')
  })

  it('never leaks the raw HTML body of a 502 into the toast (the original defect)', async () => {
    await dispatchProposeFailure(
      asError({
        status: 'PARSING_ERROR',
        originalStatus: 502,
        data: HTML_502,
        error: "SyntaxError: Unexpected token '<'",
      }),
    )

    const notification = lastNotification()
    expect(notification.message).toBe('Something went wrong on our end. Try again.')
    expect(notification.detailedMessage).toBe('Error code CGW-502')
    expect(JSON.stringify(notification)).not.toContain('nginx')
    expect(JSON.stringify(notification)).not.toContain('Bad Gateway')
    expect(JSON.stringify(notification)).not.toContain('<html')
  })

  it('surfaces exactly one toast per 422, carrying the agreed copy', async () => {
    // A 422 is our bug, not a transient failure. This pins one dispatch to one
    // toast with the agreed copy; it does not — and cannot — observe whether a
    // caller re-issues the request, so it says nothing about looping.
    await dispatchProposeFailure(asError({ status: 422, data: {} }))

    expect(showNotification).toHaveBeenCalledTimes(1)
    expect(lastNotification().message).toBe(CGW_ERROR_FALLBACK)
  })

  it('shows the banned-Safe copy for a 451', async () => {
    await dispatchProposeFailure(asError({ status: 451, data: {} }))

    expect(lastNotification().message).toBe('This Safe Account is not available.')
  })

  it('leaves an unmapped failure (404) on the existing copy', async () => {
    await dispatchProposeFailure(asError({ status: 404, data: { message: 'Not found' } }))

    const notification = lastNotification()
    expect(notification.message).toContain('Failed to add to queue')
    expect(notification.detailedMessage).toBe('Not found')
  })

  it('prefers the rate-limit copy over the CGW copy for a 429-carrying error, as the inline alert does', async () => {
    // A throttled request matches both classifiers: it is a viem rate-limit
    // error AND an HTTP 429 the CGW map covers. `TxSubmitError` answers with
    // the rate-limit copy, so the toast must too — otherwise one failure reads
    // two different ways depending on where the user sees it (WA-3252).
    // Swapping these two branches back breaks this test.
    await dispatchProposeFailure(Object.assign(new BaseError('HTTP request failed.'), { status: 429 }))

    const notification = lastNotification()
    expect(notification.message).toBe(RATE_LIMIT_USER_MESSAGE)
    expect(notification.message).not.toBe(CGW_ERROR_FALLBACK)
    // The support reference still carries the status, exactly as the inline
    // alert's code-only reference does.
    expect(notification.detailedMessage).toBe('Error code CGW-429')
  })
})
