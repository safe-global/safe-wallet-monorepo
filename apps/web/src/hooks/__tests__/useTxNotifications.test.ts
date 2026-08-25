import { act } from 'react'
import { renderHook, waitFor } from '@/tests/test-utils'
import { asError } from '@safe-global/utils/services/exceptions/utils'
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

  it('shows a 422 once and does not loop', async () => {
    // A 422 is our bug, not a transient failure: it is surfaced a single time.
    // Nothing retries CGW requests today, so this pins the AC against the
    // baseline rather than against a fix.
    await dispatchProposeFailure(asError({ status: 422, data: {} }))

    expect(showNotification).toHaveBeenCalledTimes(1)
    expect(lastNotification().message).toBe('Something went wrong on our end. Try again.')
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
})
