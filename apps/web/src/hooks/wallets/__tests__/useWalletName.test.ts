import { renderHook, waitFor } from '@/tests/test-utils'
import type { Eip1193Provider, JsonRpcProvider } from 'ethers'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { useWalletName } from '@/hooks/wallets/useWalletName'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'
import * as useChains from '@/hooks/useChains'
import * as ens from '@/services/ens'
import * as web3 from '@/hooks/wallets/web3'

const VITALIK = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'

const createWallet = (chainId = '1'): ConnectedWallet => ({
  label: 'MetaMask',
  chainId,
  address: VITALIK,
  provider: { request: jest.fn() } as unknown as Eip1193Provider,
})

const createChain = (features: FEATURES[]): Chain => ({ chainId: '1', shortName: 'eth', features }) as unknown as Chain

describe('useWalletName', () => {
  const mockProvider = { destroy: jest.fn() } as unknown as JsonRpcProvider

  beforeEach(() => {
    jest.resetAllMocks()
    jest.spyOn(web3, 'createWeb3ReadOnly').mockReturnValue(mockProvider)
  })

  it("resolves the wallet's ENS name on the wallet's chain", async () => {
    jest.spyOn(useChains, 'useChain').mockReturnValue(createChain([FEATURES.DOMAIN_LOOKUP]))
    const lookup = jest.spyOn(ens, 'lookupAddress').mockResolvedValue('vitalik.eth')

    const { result } = renderHook(() => useWalletName(createWallet('1')))

    await waitFor(() => expect(result.current).toBe('vitalik.eth'))
    expect(lookup).toHaveBeenCalledWith(mockProvider, VITALIK)
    expect(mockProvider.destroy).toHaveBeenCalled()
  })

  it('does not resolve when domain lookup is unsupported on the chain', async () => {
    jest.spyOn(useChains, 'useChain').mockReturnValue(createChain([]))
    const lookup = jest.spyOn(ens, 'lookupAddress').mockResolvedValue('vitalik.eth')

    const { result } = renderHook(() => useWalletName(createWallet('1')))

    await waitFor(() => expect(result.current).toBeUndefined())
    expect(lookup).not.toHaveBeenCalled()
  })

  it('returns undefined when the chain config is not found', async () => {
    jest.spyOn(useChains, 'useChain').mockReturnValue(undefined)
    const lookup = jest.spyOn(ens, 'lookupAddress').mockResolvedValue('vitalik.eth')

    const { result } = renderHook(() => useWalletName(createWallet('1')))

    await waitFor(() => expect(result.current).toBeUndefined())
    expect(lookup).not.toHaveBeenCalled()
  })

  it('returns undefined when no wallet is connected', async () => {
    jest.spyOn(useChains, 'useChain').mockReturnValue(createChain([FEATURES.DOMAIN_LOOKUP]))
    const lookup = jest.spyOn(ens, 'lookupAddress').mockResolvedValue('vitalik.eth')

    const { result } = renderHook(() => useWalletName(null))

    await waitFor(() => expect(result.current).toBeUndefined())
    expect(lookup).not.toHaveBeenCalled()
  })
})
