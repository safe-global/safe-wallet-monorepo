import { getSdkError } from '@walletconnect/utils'
import type { WalletKitTypes, IWalletKit } from '@reown/walletkit'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { renderHookWithStore, createTestStore, waitFor } from '@/src/tests/test-utils'
import { useSessionRequestHandler, type SessionRequestHandlerDeps } from '../useSessionRequestHandler'
import { selectPending } from '../../store/walletKitSlice'

const mockToastShow = jest.fn()
jest.mock('@tamagui/toast', () => ({ useToastController: () => ({ show: mockToastShow }) }))

const SAFE_ADDRESS = '0x1111111111111111111111111111111111111111'

const chain = { chainId: '1', chainName: 'Ethereum' } as unknown as Chain

const baseDeps: SessionRequestHandlerDeps = {
  activeChain: chain,
  activeSafeAddress: SAFE_ADDRESS,
  hasSigner: true,
  switchActiveChainByCaip2: jest.fn().mockResolvedValue({ ok: true }),
  getCallsStatus: jest.fn(),
  navigateToCallsStatus: jest.fn(),
}

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
    respondSessionRequest: jest.fn().mockResolvedValue(undefined),
    getActiveSessions: jest.fn(() => ({ topic: { peer: { metadata: { name: 'Uniswap' } } } })),
  }
  return {
    wk: wk as unknown as IWalletKit,
    respond: wk.respondSessionRequest,
    emit: (r: WalletKitTypes.SessionRequest) => listener?.(r),
  }
}

const makeRequest = (method: string, params: unknown[] = [], chainId = 'eip155:1'): WalletKitTypes.SessionRequest =>
  ({
    id: 7,
    topic: 'topic',
    params: { chainId, request: { method, params } },
  }) as unknown as WalletKitTypes.SessionRequest

beforeEach(() => jest.clearAllMocks())

describe('useSessionRequestHandler', () => {
  it('does nothing without a walletKit', () => {
    renderHookWithStore(() => useSessionRequestHandler(null, baseDeps), createTestStore({}))
  })

  it('pushes a deferred tx request to pending instead of responding', async () => {
    const { wk, respond, emit } = makeWalletKit()
    const store = createTestStore({})
    renderHookWithStore(() => useSessionRequestHandler(wk, baseDeps), store)
    emit(makeRequest('eth_sendTransaction', [{ to: '0xabc', value: '0x0', data: '0x' }]))
    await waitFor(() => expect(selectPending(store.getState())).toHaveLength(1))
    expect(respond).not.toHaveBeenCalled()
    // Stamped with the Safe it was routed against, so the safe-switch listener can match it.
    expect(selectPending(store.getState())[0]).toMatchObject({ safeAddress: SAFE_ADDRESS })
  })

  it('responds with 4100 and toasts when no signer is attached', async () => {
    const { wk, respond, emit } = makeWalletKit()
    renderHookWithStore(() => useSessionRequestHandler(wk, { ...baseDeps, hasSigner: false }), createTestStore({}))
    emit(makeRequest('eth_sendTransaction', [{ to: '0xabc' }]))
    await waitFor(() => expect(respond).toHaveBeenCalled())
    expect(mockToastShow).toHaveBeenCalledWith('No signer attached to this Safe', expect.anything())
  })

  it('responds and toasts for rejected message-signing methods', async () => {
    const { wk, respond, emit } = makeWalletKit()
    renderHookWithStore(() => useSessionRequestHandler(wk, baseDeps), createTestStore({}))
    emit(makeRequest('personal_sign', ['0xmsg', SAFE_ADDRESS]))
    await waitFor(() => expect(respond).toHaveBeenCalled())
    expect(mockToastShow).toHaveBeenCalledWith('Message signing is not yet supported on mobile', expect.anything())
  })

  it('rejects safe_setSettings silently — no message-signing toast', async () => {
    const { wk, respond, emit } = makeWalletKit()
    renderHookWithStore(() => useSessionRequestHandler(wk, baseDeps), createTestStore({}))
    emit(makeRequest('safe_setSettings', [{ offChainSigning: true }]))
    await waitFor(() => expect(respond).toHaveBeenCalled())
    expect(mockToastShow).not.toHaveBeenCalled()
  })

  it('toasts a switch-network hint when the dApp session is on a different chain', async () => {
    const { wk, respond, emit } = makeWalletKit()
    renderHookWithStore(() => useSessionRequestHandler(wk, baseDeps), createTestStore({}))
    // Active chain is 1; the dApp request targets eip155:137 → UNSUPPORTED_CHAINS reject.
    emit(makeRequest('eth_sendTransaction', [{ to: '0xabc' }], 'eip155:137'))
    await waitFor(() =>
      expect(respond).toHaveBeenCalledWith(
        expect.objectContaining({ response: expect.objectContaining({ error: expect.anything() }) }),
      ),
    )
    expect(mockToastShow).toHaveBeenCalledWith(expect.stringContaining('Uniswap'), expect.anything())
  })

  it('passes the SDK error message through for unsupported methods', async () => {
    const { wk, respond, emit } = makeWalletKit()
    renderHookWithStore(() => useSessionRequestHandler(wk, baseDeps), createTestStore({}))
    emit(makeRequest('eth_unknownMethod'))
    await waitFor(() => expect(respond).toHaveBeenCalled())
    const arg = respond.mock.calls[0][0] as { response: { error: { message: string } } }
    expect(arg.response.error.message).toBe(getSdkError('UNSUPPORTED_METHODS').message)
  })
})
