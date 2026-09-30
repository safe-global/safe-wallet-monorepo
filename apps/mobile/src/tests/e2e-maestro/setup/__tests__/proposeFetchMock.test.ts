import { walletKitE2eState } from '@/src/features/WalletConnect/Wallet/walletKitE2eState'
import { installProposeFetchMock } from '../proposeFetchMock'

const PROPOSE_URL =
  'https://gateway.test/v1/chains/11155111/transactions/0x2f3e600a3F38b66aDcbe6530B191F2BE55c2Fbb6/propose'
const OTHER_URL = 'https://gateway.test/v1/chains/11155111/safes/0x2f3e600a3F38b66aDcbe6530B191F2BE55c2Fbb6'

describe('proposeFetchMock', () => {
  const passthrough = jest.fn()

  beforeAll(() => {
    // Bind the mock first — the interceptor captures the underlying fetch at install.
    global.fetch = passthrough as unknown as typeof fetch
    installProposeFetchMock()
  })

  beforeEach(() => {
    walletKitE2eState.reset()
    passthrough.mockReset().mockResolvedValue(new Response('{}', { status: 200 }))
  })

  it('passes /propose through by default', async () => {
    const res = await fetch(PROPOSE_URL, { method: 'POST' })
    expect(passthrough).toHaveBeenCalledTimes(1)
    expect(res.status).toBe(200)
  })

  it('returns a synthetic 500 for /propose when armed', async () => {
    walletKitE2eState.set({ proposeBehavior: 'fail500' })
    const res = await fetch(PROPOSE_URL, { method: 'POST' })
    expect(res.status).toBe(500)
    expect(passthrough).not.toHaveBeenCalled()
    await expect(res.json()).resolves.toEqual({ code: 500, message: 'E2E synthetic propose failure' })
  })

  it('never intercepts non-propose URLs, even when armed', async () => {
    walletKitE2eState.set({ proposeBehavior: 'fail500' })
    const res = await fetch(OTHER_URL)
    expect(passthrough).toHaveBeenCalledTimes(1)
    expect(res.status).toBe(200)
  })

  it('reset() re-arms passthrough between flows', async () => {
    walletKitE2eState.set({ proposeBehavior: 'fail500' })
    walletKitE2eState.reset()
    await fetch(PROPOSE_URL, { method: 'POST' })
    expect(passthrough).toHaveBeenCalledTimes(1)
  })
})
