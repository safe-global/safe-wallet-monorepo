import { walletKitE2eState } from '../walletKitE2eState'

describe('walletKitE2eState', () => {
  beforeEach(() => walletKitE2eState.reset())

  it('exposes initial defaults', () => {
    expect(walletKitE2eState.get()).toEqual({
      forceNativeWalletConnect: false,
      pairBehavior: 'resolve',
      sessions: {},
      rejectSessionCalled: false,
      lastRequestResponse: null,
      proposeBehavior: 'live',
      txSetupStatus: 'idle',
    })
  })

  it('merges partial updates via set()', () => {
    walletKitE2eState.set({ forceNativeWalletConnect: true })
    walletKitE2eState.set({ pairBehavior: 'hang' })

    expect(walletKitE2eState.get().forceNativeWalletConnect).toBe(true)
    expect(walletKitE2eState.get().pairBehavior).toBe('hang')
  })

  it('reset() restores defaults', () => {
    walletKitE2eState.set({ rejectSessionCalled: true, forceNativeWalletConnect: true })
    walletKitE2eState.reset()
    expect(walletKitE2eState.get().rejectSessionCalled).toBe(false)
    expect(walletKitE2eState.get().forceNativeWalletConnect).toBe(false)
  })

  it('notifies subscribers on change and stops after unsubscribe', () => {
    const listener = jest.fn()
    const unsubscribe = walletKitE2eState.subscribe(listener)

    walletKitE2eState.set({ pairBehavior: 'reject' })
    expect(listener).toHaveBeenCalledTimes(1)

    unsubscribe()
    walletKitE2eState.set({ pairBehavior: 'resolve' })
    expect(listener).toHaveBeenCalledTimes(1)
  })
})
