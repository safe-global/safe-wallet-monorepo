import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'

export const mockConnectedWallet = (address: string, overrides: Partial<ConnectedWallet> = {}): ConnectedWallet => ({
  label: 'MetaMask',
  chainId: '1',
  address,
  provider: { request: () => Promise.resolve(null) },
  ...overrides,
})
