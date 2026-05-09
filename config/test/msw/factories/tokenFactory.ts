import { faker } from '@faker-js/faker'
import { createMockAddress } from './safeFactory'

/**
 * Token and balance mock data factory
 *
 * Generates mock token/balance data for Storybook stories.
 */

export type MockTokenInfo = {
  name: string
  symbol: string
  decimals: number
  address: string
  type: 'NATIVE_TOKEN' | 'ERC20' | 'ERC721'
  logoUri: string | null
}

export type MockBalance = {
  tokenInfo: MockTokenInfo
  balance: string
  fiatBalance: string
  fiatConversion: string
}

export type MockCollectible = {
  id: string
  address: string
  tokenName: string
  tokenSymbol: string
  logoUri: string | null
  name: string
  description: string | null
  uri: string
  imageUri: string | null
}

// Well-known token addresses (Ethereum mainnet)
export const KNOWN_TOKENS = {
  ETH: {
    address: '0x0000000000000000000000000000000000000000',
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
    logoUri: 'https://safe-transaction-assets.safe.global/chains/1/currency_logo.png',
  },
  USDC: {
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    logoUri: 'https://safe-transaction-assets.safe.global/tokens/logos/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48.png',
  },
  USDT: {
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    name: 'Tether USD',
    symbol: 'USDT',
    decimals: 6,
    logoUri: 'https://safe-transaction-assets.safe.global/tokens/logos/0xdAC17F958D2ee523a2206206994597C13D831ec7.png',
  },
  DAI: {
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    name: 'Dai Stablecoin',
    symbol: 'DAI',
    decimals: 18,
    logoUri: 'https://safe-transaction-assets.safe.global/tokens/logos/0x6B175474E89094C44Da98b954EedeAC495271d0F.png',
  },
  WETH: {
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    logoUri: 'https://safe-transaction-assets.safe.global/tokens/logos/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2.png',
  },
} as const

/**
 * Create a mock token info
 */
export const createMockTokenInfo = (overrides?: Partial<MockTokenInfo>): MockTokenInfo => ({
  name: faker.finance.currencyName(),
  symbol: faker.finance.currencyCode(),
  decimals: 18,
  address: createMockAddress(),
  type: 'ERC20',
  logoUri: null,
  ...overrides,
})

/**
 * Create a native token (ETH) info
 */
export const createNativeTokenInfo = (): MockTokenInfo => ({
  ...KNOWN_TOKENS.ETH,
  type: 'NATIVE_TOKEN',
})

/**
 * Create a mock balance entry
 */
export const createMockBalance = (overrides?: Partial<MockBalance>): MockBalance => {
  const tokenInfo = overrides?.tokenInfo ?? createMockTokenInfo()
  const balance = overrides?.balance ?? '1000000000000000000' // 1 token (18 decimals)
  const fiatBalance = overrides?.fiatBalance ?? '1000.00'

  return {
    tokenInfo,
    balance,
    fiatBalance,
    fiatConversion: overrides?.fiatConversion ?? fiatBalance,
  }
}

/**
 * Create a balance entry for a known token
 */
export const createKnownTokenBalance = (
  token: keyof typeof KNOWN_TOKENS,
  balance: string,
  fiatBalance: string,
): MockBalance => ({
  tokenInfo: {
    ...KNOWN_TOKENS[token],
    type: token === 'ETH' ? 'NATIVE_TOKEN' : 'ERC20',
  },
  balance,
  fiatBalance,
  fiatConversion: token === 'ETH' ? fiatBalance : '1.00',
})

/**
 * Create a mock collectible (NFT)
 */
export const createMockCollectible = (overrides?: Partial<MockCollectible>): MockCollectible => ({
  id: faker.string.uuid(),
  address: createMockAddress(),
  tokenName: faker.company.name(),
  tokenSymbol: faker.string.alpha({ length: 4, casing: 'upper' }),
  logoUri: null,
  name: `${faker.company.name()} #${faker.number.int({ min: 1, max: 9999 })}`,
  description: faker.lorem.sentence(),
  uri: `ipfs://${faker.string.alphanumeric(46)}`,
  imageUri: null,
  ...overrides,
})

/**
 * Preset balance configurations for common scenarios
 */
export const balanceMocks = {
  /** Empty wallet with no tokens */
  empty: () => ({
    items: [],
    fiatTotal: '0.00',
  }),

  /** Wallet with only ETH */
  ethOnly: () => ({
    items: [createKnownTokenBalance('ETH', '1000000000000000000', '3000.00')],
    fiatTotal: '3000.00',
  }),

  /** Diversified portfolio */
  diversified: () => ({
    items: [
      createKnownTokenBalance('ETH', '2000000000000000000', '6000.00'),
      createKnownTokenBalance('USDC', '5000000000', '5000.00'),
      createKnownTokenBalance('DAI', '2000000000000000000000', '2000.00'),
      createKnownTokenBalance('WETH', '500000000000000000', '1500.00'),
    ],
    fiatTotal: '14500.00',
  }),

  /** Stablecoin heavy portfolio */
  stablecoins: () => ({
    items: [
      createKnownTokenBalance('USDC', '10000000000', '10000.00'),
      createKnownTokenBalance('USDT', '5000000000', '5000.00'),
      createKnownTokenBalance('DAI', '3000000000000000000000', '3000.00'),
    ],
    fiatTotal: '18000.00',
  }),

  /** High value wallet */
  highValue: () => ({
    items: [
      createKnownTokenBalance('ETH', '100000000000000000000', '300000.00'),
      createKnownTokenBalance('USDC', '200000000000', '200000.00'),
    ],
    fiatTotal: '500000.00',
  }),

  /** Small dust amounts */
  dust: () => ({
    items: [
      createKnownTokenBalance('ETH', '1000000000000000', '3.00'), // 0.001 ETH
      createMockBalance({
        tokenInfo: createMockTokenInfo({ name: 'Random Token', symbol: 'RND' }),
        balance: '100',
        fiatBalance: '0.01',
      }),
    ],
    fiatTotal: '3.01',
  }),
}

/**
 * Preset collectible configurations
 */
export const collectibleMocks = {
  /** No collectibles */
  empty: () => ({
    count: 0,
    next: null,
    previous: null,
    results: [],
  }),

  /** Single NFT */
  single: () => ({
    count: 1,
    next: null,
    previous: null,
    results: [
      createMockCollectible({
        tokenName: 'Bored Ape Yacht Club',
        tokenSymbol: 'BAYC',
        name: 'BAYC #1234',
        address: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
      }),
    ],
  }),

  /** Multiple NFTs from different collections */
  multiple: () => ({
    count: 3,
    next: null,
    previous: null,
    results: [
      createMockCollectible({
        tokenName: 'Bored Ape Yacht Club',
        tokenSymbol: 'BAYC',
        name: 'BAYC #1234',
      }),
      createMockCollectible({
        tokenName: 'Azuki',
        tokenSymbol: 'AZUKI',
        name: 'Azuki #5678',
      }),
      createMockCollectible({
        tokenName: 'Doodles',
        tokenSymbol: 'DOODLE',
        name: 'Doodle #9012',
      }),
    ],
  }),
}

/**
 * Supported fiat currencies
 */
export const supportedFiatCurrencies = ['USD', 'EUR', 'GBP', 'CHF', 'AUD', 'CAD', 'JPY']
