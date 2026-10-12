import { act, render, waitFor } from '@testing-library/react'
import type { ChainInfo as SdkChainInfo } from '@safe-global/safe-apps-sdk'
import type { ChainInfo as GatewayChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { FEATURES, RPC_AUTHENTICATION, getChainConfig } from '@safe-global/safe-gateway-typescript-sdk'
import { JsonRpcProvider } from 'ethers'
import NetworkProvider, { useNetwork } from './networkContext'

const RESOLVED_ADDRESS = '0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326'
const BASE_COIN_TYPE = (0x80000000 | 8453) >>> 0

const mockResolveName = jest.fn()
const mockDestroy = jest.fn()
const mockGetChainInfo = jest.fn()
// Stable across renders: the provider effect is keyed on `sdk.safe`
const mockSafeAppsSDK = {
  sdk: { safe: { getChainInfo: mockGetChainInfo } },
  safe: { safeAddress: '0x0000000000000000000000000000000000000001', chainId: 1 },
}

jest.mock('@safe-global/safe-apps-react-sdk', () => ({
  useSafeAppsSDK: () => mockSafeAppsSDK,
}))

jest.mock('@safe-global/safe-gateway-typescript-sdk', () => ({
  ...jest.requireActual('@safe-global/safe-gateway-typescript-sdk'),
  getChainConfig: jest.fn(),
}))

jest.mock('@safe-global/safe-apps-provider', () => ({
  SafeAppProvider: jest.fn(),
}))

jest.mock('../lib/interfaceRepository', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('ethers', () => ({
  ...jest.requireActual('ethers'),
  BrowserProvider: jest.fn(),
  JsonRpcProvider: jest.fn(() => ({ resolveName: mockResolveName, destroy: mockDestroy })),
}))

const sdkChain = (chainId: string): SdkChainInfo =>
  ({ chainId, chainName: 'Chain', shortName: 'chain', nativeCurrency: { symbol: 'ETH' } }) as SdkChainInfo

const gatewayChain = (overrides: Partial<GatewayChainInfo>): GatewayChainInfo =>
  ({
    chainId: '1',
    isTestnet: false,
    features: [FEATURES.DOMAIN_LOOKUP],
    publicRpcUri: { authentication: RPC_AUTHENTICATION.NO_AUTHENTICATION, value: 'https://mainnet.rpc' },
    rpcUri: { authentication: RPC_AUTHENTICATION.NO_AUTHENTICATION, value: 'https://mainnet.rpc' },
    ...overrides,
  }) as unknown as GatewayChainInfo

const MAINNET_HUB = gatewayChain({ chainId: '1' })
const SEPOLIA_HUB = gatewayChain({
  chainId: '11155111',
  isTestnet: true,
  publicRpcUri: { authentication: RPC_AUTHENTICATION.NO_AUTHENTICATION, value: 'https://sepolia.rpc' },
})
const BASE = gatewayChain({ chainId: '8453', features: [] })
const BASE_SEPOLIA = gatewayChain({ chainId: '84532', isTestnet: true, features: [] })

let latest: ReturnType<typeof useNetwork> | undefined

const Probe = () => {
  latest = useNetwork()
  return null
}

const renderNetwork = () =>
  render(
    <NetworkProvider>
      <Probe />
    </NetworkProvider>,
  )

const resolve = (name: string) => act(async () => latest?.getAddressFromDomain(name)) as Promise<string | undefined>

const mockChains = (...chains: GatewayChainInfo[]) => {
  ;(getChainConfig as jest.Mock).mockImplementation((chainId: string) => {
    const chain = chains.find((c) => c.chainId === chainId)
    return chain ? Promise.resolve(chain) : Promise.reject(new Error(`no config for ${chainId}`))
  })
}

describe('NetworkProvider ENS hub', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    latest = undefined
    mockResolveName.mockResolvedValue(RESOLVED_ADDRESS)
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('resolves names for a production Safe on the mainnet hub with the target chain coin type', async () => {
    mockGetChainInfo.mockResolvedValue(sdkChain('8453'))
    mockChains(BASE, MAINNET_HUB)

    renderNetwork()

    await waitFor(() => {
      expect(JsonRpcProvider).toHaveBeenCalledWith('https://mainnet.rpc', 1, { staticNetwork: true, batchMaxCount: 3 })
    })
    await expect(resolve('vitalik.eth')).resolves.toBe(RESOLVED_ADDRESS)
    expect(mockResolveName).toHaveBeenCalledWith('vitalik.eth', BASE_COIN_TYPE)
  })

  it('resolves names for a testnet Safe on the Sepolia hub', async () => {
    mockGetChainInfo.mockResolvedValue(sdkChain('84532'))
    mockChains(BASE_SEPOLIA, SEPOLIA_HUB)

    renderNetwork()

    await waitFor(() => {
      expect(JsonRpcProvider).toHaveBeenCalledWith('https://sepolia.rpc', 11155111, {
        staticNetwork: true,
        batchMaxCount: 3,
      })
    })
    await expect(resolve('vitalik.eth')).resolves.toBe(RESOLVED_ADDRESS)
  })

  it('reuses the Safe chain config when the Safe is on the hub itself', async () => {
    mockGetChainInfo.mockResolvedValue(sdkChain('1'))
    mockChains(MAINNET_HUB)

    renderNetwork()

    await waitFor(() => {
      expect(JsonRpcProvider).toHaveBeenCalledTimes(1)
    })
    expect(getChainConfig).toHaveBeenCalledTimes(1)
    expect(getChainConfig).toHaveBeenCalledWith('1')
  })

  it('leaves names unresolved when the hub has no domain lookup, even if the Safe chain has it', async () => {
    mockGetChainInfo.mockResolvedValue(sdkChain('8453'))
    mockChains(
      gatewayChain({ chainId: '8453', features: [FEATURES.DOMAIN_LOOKUP] }),
      gatewayChain({ chainId: '1', features: [] }),
    )

    renderNetwork()

    await waitFor(() => {
      expect(getChainConfig).toHaveBeenCalledWith('1')
    })
    await expect(resolve('vitalik.eth')).resolves.toBe('vitalik.eth')
    expect(JsonRpcProvider).not.toHaveBeenCalled()
    expect(mockResolveName).not.toHaveBeenCalled()
  })

  it('leaves names unresolved when the hub config cannot be loaded', async () => {
    mockGetChainInfo.mockResolvedValue(sdkChain('8453'))
    mockChains(BASE)

    renderNetwork()

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Unable to configure the ENS hub provider:', expect.any(Error))
    })
    await expect(resolve('vitalik.eth')).resolves.toBe('vitalik.eth')
    expect(JsonRpcProvider).not.toHaveBeenCalled()
  })

  it('returns the name when hub resolution fails', async () => {
    mockGetChainInfo.mockResolvedValue(sdkChain('8453'))
    mockChains(BASE, MAINNET_HUB)
    mockResolveName.mockRejectedValue(new Error('rpc down'))

    renderNetwork()

    await waitFor(() => {
      expect(JsonRpcProvider).toHaveBeenCalled()
    })
    await expect(resolve('vitalik.eth')).resolves.toBe('vitalik.eth')
  })

  it('destroys the hub provider on unmount', async () => {
    mockGetChainInfo.mockResolvedValue(sdkChain('8453'))
    mockChains(BASE, MAINNET_HUB)

    const { unmount } = renderNetwork()

    await waitFor(() => {
      expect(JsonRpcProvider).toHaveBeenCalled()
    })
    unmount()

    expect(mockDestroy).toHaveBeenCalledTimes(1)
  })
})
