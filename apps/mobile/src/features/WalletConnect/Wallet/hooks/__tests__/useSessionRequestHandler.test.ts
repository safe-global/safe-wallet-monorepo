import type { WalletKitTypes, IWalletKit } from '@reown/walletkit'
import { renderHookWithStore, createTestStore } from '@/src/tests/test-utils'
import { useSessionRequestHandler } from '../useSessionRequestHandler'
import { sessionRequestReceived } from '../../store/walletKitSlice'

// Capture the registered session_request listener so tests can invoke it directly.
const makeWalletKit = () => {
  let listener: ((r: WalletKitTypes.SessionRequest) => void) | undefined
  const wk = {
    on: jest.fn((event: string, cb: (r: WalletKitTypes.SessionRequest) => void) => {
      if (event === 'session_request') {
        listener = cb
      }
    }),
    off: jest.fn(),
  }
  return {
    wk: wk as unknown as IWalletKit,
    off: wk.off,
    emit: (r: WalletKitTypes.SessionRequest) => listener?.(r),
  }
}

const request = {
  id: 7,
  topic: 'topic',
  params: { chainId: 'eip155:1', request: { method: 'eth_sendTransaction', params: [{ to: '0xabc' }] } },
} as unknown as WalletKitTypes.SessionRequest

beforeEach(() => jest.clearAllMocks())

describe('useSessionRequestHandler', () => {
  it('does nothing without a walletKit', () => {
    const store = createTestStore({})
    const dispatchSpy = jest.spyOn(store, 'dispatch')
    renderHookWithStore(() => useSessionRequestHandler(null), store)
    expect(dispatchSpy).not.toHaveBeenCalled()
  })

  it('dispatches sessionRequestReceived when a session_request fires', () => {
    const { wk, emit } = makeWalletKit()
    const store = createTestStore({})
    const dispatchSpy = jest.spyOn(store, 'dispatch')
    renderHookWithStore(() => useSessionRequestHandler(wk), store)

    emit(request)

    expect(dispatchSpy).toHaveBeenCalledWith(sessionRequestReceived(request))
  })

  it('unsubscribes from session_request on unmount', () => {
    const { wk, off } = makeWalletKit()
    const { unmount } = renderHookWithStore(() => useSessionRequestHandler(wk), createTestStore({}))
    unmount()
    expect(off).toHaveBeenCalledWith('session_request', expect.any(Function))
  })
})
