import { cgwChainToReownNetwork, cgwChainsToReownNetworks } from '../chains'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

const mockLoggerWarn = jest.fn()

jest.mock('@/src/utils/logger', () => ({
  __esModule: true,
  default: {
    warn: (...args: unknown[]) => mockLoggerWarn(...args),
  },
}))

describe('cgwChainToReownNetwork', () => {
  const makeChain = (overrides: Partial<Chain> = {}): Chain =>
    ({
      chainId: '1',
      chainName: 'Ethereum',
      isTestnet: false,
      chainLogoUri: 'https://safe-global.github.io/safe-token/ethereum.png',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18, logoUri: '' },
      publicRpcUri: { authentication: 'NO_AUTHENTICATION', value: 'https://rpc.ankr.com/eth' },
      blockExplorerUriTemplate: {
        address: 'https://etherscan.io/address/{{address}}',
        api: '',
        txHash: '',
      },
      ...overrides,
    }) as Chain

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('converts a CGW chain to a Reown network', () => {
    const result = cgwChainToReownNetwork(makeChain())

    expect(result).toEqual({
      id: 1,
      name: 'Ethereum',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: { default: { http: ['https://rpc.ankr.com/eth'] } },
      blockExplorers: { default: { name: 'Ethereum', url: 'https://etherscan.io' } },
      chainNamespace: 'eip155',
      caipNetworkId: 'eip155:1',
      testnet: false,
      imageUrl: 'https://safe-global.github.io/safe-token/ethereum.png',
    })
  })

  it('returns undefined for chains with API_KEY_PATH authentication', () => {
    const chain = makeChain({
      publicRpcUri: { authentication: 'API_KEY_PATH', value: 'https://rpc.example.com/{API_KEY}' },
    })

    expect(cgwChainToReownNetwork(chain)).toBeUndefined()
    expect(mockLoggerWarn).toHaveBeenCalledWith(expect.stringContaining('Skipping chain 1'))
  })

  it('sets testnet to true for test networks', () => {
    const result = cgwChainToReownNetwork(makeChain({ chainId: '11155111', isTestnet: true }))

    expect(result?.testnet).toBe(true)
  })

  it('omits imageUrl when chainLogoUri is null', () => {
    const result = cgwChainToReownNetwork(makeChain({ chainLogoUri: null }))

    expect(result).toBeDefined()
    expect(result).not.toHaveProperty('imageUrl')
  })

  it('omits blockExplorers when template URL is invalid', () => {
    const result = cgwChainToReownNetwork(
      makeChain({
        blockExplorerUriTemplate: { address: 'not-a-url', api: '', txHash: '' },
      }),
    )

    expect(result).toBeDefined()
    expect(result).not.toHaveProperty('blockExplorers')
  })

  it('parses chainId as integer', () => {
    const result = cgwChainToReownNetwork(makeChain({ chainId: '137' }))

    expect(result?.id).toBe(137)
    expect(result?.caipNetworkId).toBe('eip155:137')
  })
})

describe('cgwChainsToReownNetworks', () => {
  const makeChain = (chainId: string, auth: 'NO_AUTHENTICATION' | 'API_KEY_PATH' = 'NO_AUTHENTICATION'): Chain =>
    ({
      chainId,
      chainName: `Chain ${chainId}`,
      isTestnet: false,
      chainLogoUri: null,
      nativeCurrency: { name: 'Token', symbol: 'TKN', decimals: 18, logoUri: '' },
      publicRpcUri: { authentication: auth, value: `https://rpc.chain${chainId}.com` },
      blockExplorerUriTemplate: { address: `https://explorer${chainId}.com/address/{{address}}`, api: '', txHash: '' },
    }) as Chain

  it('converts multiple chains and filters out API_KEY_PATH chains', () => {
    const chains = [makeChain('1'), makeChain('137'), makeChain('42161', 'API_KEY_PATH')]

    const result = cgwChainsToReownNetworks(chains)

    expect(result).toHaveLength(2)
    expect(result[0].id).toBe(1)
    expect(result[1].id).toBe(137)
  })

  it('returns empty array for empty input', () => {
    expect(cgwChainsToReownNetworks([])).toEqual([])
  })

  it('returns empty array when all chains require API keys', () => {
    const chains = [makeChain('1', 'API_KEY_PATH'), makeChain('137', 'API_KEY_PATH')]

    expect(cgwChainsToReownNetworks(chains)).toEqual([])
  })
})
