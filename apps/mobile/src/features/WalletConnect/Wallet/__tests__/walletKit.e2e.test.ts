import { getWalletKit } from '../walletKit.e2e'
import { walletKitE2eState } from '../walletKitE2eState'
import { APPROVED_SESSION } from '@/src/tests/e2e-maestro/setup/walletConnectDappsSetup'

describe('walletKit.e2e (fake WalletKit)', () => {
  beforeEach(() => walletKitE2eState.reset())

  it('pair() resolves when pairBehavior is "resolve"', async () => {
    const wk = await getWalletKit()
    await expect(wk.pair({ uri: 'wc:x@2' })).resolves.toBeUndefined()
  })

  it('pair() throws when pairBehavior is "reject"', async () => {
    walletKitE2eState.set({ pairBehavior: 'reject' })
    const wk = await getWalletKit()
    await expect(wk.pair({ uri: 'wc:x@2' })).rejects.toThrow('E2E pair rejected')
  })

  it('pair() never resolves when pairBehavior is "hang"', async () => {
    walletKitE2eState.set({ pairBehavior: 'hang' })
    const wk = await getWalletKit()
    const sentinel = Symbol('pending')
    const race = await Promise.race([wk.pair({ uri: 'wc:x@2' }), Promise.resolve(sentinel)])
    expect(race).toBe(sentinel)
  })

  it('approveSession() returns APPROVED_SESSION and reflects it in getActiveSessions()', async () => {
    const wk = await getWalletKit()
    expect(wk.getActiveSessions()).toEqual({})

    await expect(wk.approveSession({ id: 1, namespaces: {} })).resolves.toBe(APPROVED_SESSION)
    expect(wk.getActiveSessions()).toEqual({ [APPROVED_SESSION.topic]: APPROVED_SESSION })

    // disconnect removes it again, so setSessions(getActiveSessions()) can't resurrect it.
    await wk.disconnectSession({ topic: APPROVED_SESSION.topic, reason: { code: 6000, message: 'x' } })
    expect(wk.getActiveSessions()).toEqual({})
  })

  it('rejectSession() flips the rejectSessionCalled side-channel', async () => {
    const wk = await getWalletKit()
    expect(walletKitE2eState.get().rejectSessionCalled).toBe(false)
    await wk.rejectSession({ id: 1, reason: { code: 1, message: 'x' } })
    expect(walletKitE2eState.get().rejectSessionCalled).toBe(true)
  })

  it('getActiveSessions()/getPendingSessionRequests() return empty', async () => {
    const wk = await getWalletKit()
    expect(wk.getActiveSessions()).toEqual({})
    expect(wk.getPendingSessionRequests()).toEqual([])
  })
})
