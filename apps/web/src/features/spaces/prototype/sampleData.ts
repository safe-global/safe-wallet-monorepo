export type SampleAsset = {
  type: 'token' | 'position'
  protocol: string
  symbol: string
  name: string
  tokenAddress: string
  quantity: number
  priceUsd: number
}

export type SampleSafe = {
  name: string
  address: string
  /** Balances that do not move between months, so the change column shows "No change". */
  isStatic: boolean
  chains: { name: string; chainId: number; assets: SampleAsset[] }[]
}

export type SampleMonth = {
  id: string
  label: string
  shortLabel: string
  asOf: string
  asOfIso: string
  fileDate: string
  step: number
  priceScale: number
}

const ETH_USD = 3412.55
const BTC_USD = 96210

const USDC_ETHEREUM = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
const USDT_ETHEREUM = '0xdac17f958d2ee523a2206206994597c13d831ec7'
const DAI_ETHEREUM = '0x6b175474e89094c44da98b954eedeac495271d0f'
const WBTC_ETHEREUM = '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599'
const STETH_ETHEREUM = '0xae7ab96520de3a18e5e111b5eaac095312d7fe84'
const USDC_BASE = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913'
const USDC_ARBITRUM = '0xaf88d065e77c8cc2239327c5edb3a432268e5831'
const USDC_OPTIMISM = '0x0b2c639c533813f4aa9d7837caf62653d097ff85'

const token = (
  symbol: string,
  name: string,
  tokenAddress: string,
  quantity: number,
  priceUsd: number,
): SampleAsset => ({
  type: 'token',
  protocol: '',
  symbol,
  name,
  tokenAddress,
  quantity,
  priceUsd,
})

const position = (
  protocol: string,
  symbol: string,
  name: string,
  tokenAddress: string,
  quantity: number,
  priceUsd: number,
): SampleAsset => ({ type: 'position', protocol, symbol, name, tokenAddress, quantity, priceUsd })

export const SAMPLE_WORKSPACE_NAME = 'Acme Treasury'
export const SAMPLE_WORKSPACE_SLUG = 'acme-treasury'
export const SAMPLE_TRIAL_END = '31 December 2026'
export const SAMPLE_UNREADABLE_SAFE = 'Revenue inflows'

export const SAMPLE_SAFES: SampleSafe[] = [
  {
    name: 'Treasury main',
    address: '0x7443be10c3f5b41c07398092505e07c7440c5289',
    isStatic: false,
    chains: [
      {
        name: 'Ethereum',
        chainId: 1,
        assets: [
          token('ETH', 'Ether', '', 412.5, ETH_USD),
          token('USDC', 'USD Coin', USDC_ETHEREUM, 2150000, 1),
          token('WBTC', 'Wrapped Bitcoin', WBTC_ETHEREUM, 18.25, BTC_USD),
          position('Aave V3', 'USDC', 'USD Coin (supplied)', USDC_ETHEREUM, 1200000, 1),
          position('Aave V3', 'USDT', 'Tether USD (borrowed)', USDT_ETHEREUM, -200000, 1),
        ],
      },
      {
        name: 'Arbitrum',
        chainId: 42161,
        assets: [token('USDC', 'USD Coin', USDC_ARBITRUM, 340000.5, 1), token('ETH', 'Ether', '', 12.04, ETH_USD)],
      },
    ],
  },
  {
    name: 'Operations',
    address: '0xb2b21b9b68cfe135622d05c0f4ebbd66adf42c33',
    isStatic: false,
    chains: [
      {
        name: 'Ethereum',
        chainId: 1,
        assets: [token('USDC', 'USD Coin', USDC_ETHEREUM, 185400.12, 1), token('ETH', 'Ether', '', 6.3, ETH_USD)],
      },
      { name: 'Base', chainId: 8453, assets: [token('USDC', 'USD Coin', USDC_BASE, 42310, 1)] },
    ],
  },
  {
    name: 'Payroll',
    address: '0x0d0fc7b093e75f97ef4ab2ce39eb7481fec80a3e',
    isStatic: false,
    chains: [
      {
        name: 'Base',
        chainId: 8453,
        assets: [token('USDC', 'USD Coin', USDC_BASE, 96000, 1), token('ETH', 'Ether', '', 0.8, ETH_USD)],
      },
    ],
  },
  {
    name: 'Revenue inflows',
    address: '0x27da36e4c075cefa039bd47d6ab0b66bbc6053c1',
    isStatic: false,
    chains: [
      {
        name: 'Ethereum',
        chainId: 1,
        assets: [
          token('USDC', 'USD Coin', USDC_ETHEREUM, 512330.77, 1),
          token('USDT', 'Tether USD', USDT_ETHEREUM, 88104.2, 1),
          token('DAI', 'Dai Stablecoin', DAI_ETHEREUM, 12400, 1),
        ],
      },
      { name: 'Optimism', chainId: 10, assets: [token('USDC', 'USD Coin', USDC_OPTIMISM, 73250, 1)] },
    ],
  },
  {
    name: 'Staking',
    address: '0x6539a37f654efc126e8f68ab0e4e5c0915691d7b',
    isStatic: false,
    chains: [
      {
        name: 'Ethereum',
        chainId: 1,
        assets: [
          position('Lido', 'stETH', 'Liquid staked Ether', STETH_ETHEREUM, 950, ETH_USD),
          token('ETH', 'Ether', '', 2.1, ETH_USD),
        ],
      },
    ],
  },
  {
    name: 'Grants',
    address: '0xb0865f9490666975dc9c05a9434d2324662d0b76',
    isStatic: true,
    chains: [{ name: 'Ethereum', chainId: 1, assets: [token('DAI', 'Dai Stablecoin', DAI_ETHEREUM, 250000, 1)] }],
  },
  {
    name: 'Cold reserve',
    address: '0xfef5cb2f363097ad378f9ac7e7dbc8c2c025d520',
    isStatic: true,
    chains: [
      {
        name: 'Ethereum',
        chainId: 1,
        assets: [
          token('ETH', 'Ether', '', 1500, ETH_USD),
          token('WBTC', 'Wrapped Bitcoin', WBTC_ETHEREUM, 40, BTC_USD),
        ],
      },
    ],
  },
  {
    name: 'Legacy 2023',
    address: '0x08cf3a4362ddf6005be1cb7629b00aac8dcd1eb3',
    isStatic: false,
    chains: [{ name: 'Ethereum', chainId: 1, assets: [] }],
  },
]

const monthEnd = (
  id: string,
  month: string,
  shortLabel: string,
  nextMonth: string,
  fileDate: string,
  asOfIso: string,
  step: number,
  priceScale: number,
): SampleMonth => ({
  id,
  label: `End of ${month}`,
  shortLabel,
  asOf: `End of ${month}. Prices at 00:00 UTC on 1 ${nextMonth}.`,
  asOfIso,
  fileDate,
  step,
  priceScale,
})

/** Newest first: now, then the last 6 month ends. */
export const SAMPLE_MONTHS: SampleMonth[] = [
  {
    id: 'now',
    label: 'Now',
    shortLabel: 'Now',
    asOf: 'As of 15 December 2026, 14:10 UTC',
    asOfIso: '2026-12-15T14:10:22Z',
    fileDate: '2026-12-15',
    step: 6,
    priceScale: 1,
  },
  monthEnd('2026-11', 'November 2026', 'Nov', 'December 2026', '2026-11-30', '2026-12-01T00:00:00Z', 4, 0.97),
  monthEnd('2026-10', 'October 2026', 'Oct', 'November 2026', '2026-10-31', '2026-11-01T00:00:00Z', 3, 0.9),
  monthEnd('2026-09', 'September 2026', 'Sep', 'October 2026', '2026-09-30', '2026-10-01T00:00:00Z', 2, 0.93),
  monthEnd('2026-08', 'August 2026', 'Aug', 'September 2026', '2026-08-31', '2026-09-01T00:00:00Z', 1, 0.88),
  monthEnd('2026-07', 'July 2026', 'Jul', 'August 2026', '2026-07-31', '2026-08-01T00:00:00Z', 0, 0.82),
  monthEnd('2026-06', 'June 2026', 'Jun', 'July 2026', '2026-06-30', '2026-07-01T00:00:00Z', 5, 1.02),
]
