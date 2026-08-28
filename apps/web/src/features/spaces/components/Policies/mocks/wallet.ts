import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'

/** A connected wallet, typed rather than cast, so tests can vary the address without an assertion. */
export const mockConnectedWallet = (address: string, overrides: Partial<ConnectedWallet> = {}): ConnectedWallet => ({
  label: 'MetaMask',
  chainId: '1',
  address,
  provider: { request: () => Promise.resolve(null) },
  ...overrides,
})
