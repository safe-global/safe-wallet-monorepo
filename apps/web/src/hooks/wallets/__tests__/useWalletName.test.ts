import { renderHook, waitFor } from '@/tests/test-utils'
import type { Eip1193Provider, JsonRpcProvider } from 'ethers'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { useWalletName } from '@/hooks/wallets/useWalletName'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'
import * as ens from '@/services/ens'
import { useEnsHubProvider } from '@/hooks/useEnsHubProvider'
import { ENS_HUB_MAINNET, ETH_COIN_TYPE } from '@safe-global/utils/utils/ens'

jest.mock('@/hooks/useEnsHubProvider', () => ({
  useEnsHubProvider: jest.fn(),
}))

const VITALIK = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'

const createWallet = (chainId = '1'): ConnectedWallet => ({
  label: 'MetaMask',
  chainId,
  address: VITALIK,
  provider: { request: jest.fn() } as unknown as Eip1193Provider,
})

const createChain = (features: FEATURES[]): Chain =>
  ({ chainId: ENS_HUB_MAINNET, shortName: 'eth', isTestnet: false, features }) as unknown as Chain

const mockUseEnsHubProvider = useEnsHubProvider as jest.MockedFunction<typeof useEnsHubProvider>

describe('useWalletName', () => {
  const mockProvider = { destroy: jest.fn() } as unknown as JsonRpcProvider

  beforeEach(() => {
    jest.resetAllMocks()
    mockUseEnsHubProvider.mockReturnValue({
      hubChain: createChain([FEATURES.DOMAIN_LOOKUP]),
      provider: mockProvider,
      isDomainLookupEnabled: true,
    })
  })

  it("resolves the wallet's ENS primary name on Ethereum mainnet", async () => {
    const lookup = jest.spyOn(ens, 'lookupAddress').mockResolvedValue('vitalik.eth')

    const { result } = renderHook(() => useWalletName(createWallet('8453')))

    await waitFor(() => expect(result.current).toBe('vitalik.eth'))
    expect(mockUseEnsHubProvider).toHaveBeenCalledWith(
      expect.objectContaining({ chainId: ENS_HUB_MAINNET, isTestnet: false }),
    )
    expect(lookup).toHaveBeenCalledWith(mockProvider, VITALIK, ETH_COIN_TYPE)
    // Shared hub provider must not be destroyed by this hook
    expect(mockProvider.destroy).not.toHaveBeenCalled()
  })

  it('does not resolve when domain lookup is unsupported on mainnet', async () => {
    mockUseEnsHubProvider.mockReturnValue({
      hubChain: createChain([]),
      provider: mockProvider,
      isDomainLookupEnabled: false,
    })
    const lookup = jest.spyOn(ens, 'lookupAddress').mockResolvedValue('vitalik.eth')

    const { result } = renderHook(() => useWalletName(createWallet('1')))

    await waitFor(() => expect(result.current).toBeUndefined())
    expect(lookup).not.toHaveBeenCalled()
  })

  it('returns undefined when the hub provider is unavailable', async () => {
    mockUseEnsHubProvider.mockReturnValue({
      hubChain: undefined,
      provider: undefined,
      isDomainLookupEnabled: false,
    })
    const lookup = jest.spyOn(ens, 'lookupAddress').mockResolvedValue('vitalik.eth')

    const { result } = renderHook(() => useWalletName(createWallet('1')))

    await waitFor(() => expect(result.current).toBeUndefined())
    expect(lookup).not.toHaveBeenCalled()
  })

  it('returns undefined when no wallet is connected', async () => {
    const lookup = jest.spyOn(ens, 'lookupAddress').mockResolvedValue('vitalik.eth')

    const { result } = renderHook(() => useWalletName(null))

    await waitFor(() => expect(result.current).toBeUndefined())
    expect(lookup).not.toHaveBeenCalled()
  })
})
