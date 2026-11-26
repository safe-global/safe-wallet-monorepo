import { faker } from '@faker-js/faker'
import type { Protocol } from '@safe-global/store/gateway/AUTO_GENERATED/positions'
import { balanceBuilder, erc20TokenBuilder } from '@/tests/builders/balances'
import { safeItemBuilder } from '@/tests/builders/safeItem'
import {
  aggregateReports,
  filterAssetsSafes,
  groupHoldings,
  NO_ASSETS_FILTERS,
  searchHoldings,
  summarizeHoldings,
  toAssetsSafes,
  toHoldings,
  type AssetHolding,
} from './utils'

const address = () => faker.finance.ethereumAddress()

const usdc = (amount: string, fiatBalance: string) =>
  balanceBuilder()
    .with({
      balance: amount,
      fiatBalance,
      tokenInfo: erc20TokenBuilder().with({ symbol: 'USDC', name: 'USD Coin', decimals: 6 }).build(),
    })
    .build()

const holding = (overrides: Partial<AssetHolding>): AssetHolding => ({
  id: faker.string.uuid(),
  safeAddress: address(),
  chainId: '1',
  assetKey: 'ETH',
  name: 'Ether',
  symbol: 'ETH',
  isPosition: false,
  type: 'Token',
  amount: 1,
  fiat: 1,
  ...overrides,
})

describe('toAssetsSafes', () => {
  it('groups the networks of one address, ignoring the address case, in the given order', () => {
    const first = address()
    const second = address()

    const safes = toAssetsSafes([
      safeItemBuilder().with({ address: first, chainId: '1' }).build(),
      safeItemBuilder().with({ address: second, chainId: '1' }).build(),
      safeItemBuilder()
        .with({ address: first.toUpperCase().replace('0X', '0x'), chainId: '10' })
        .build(),
    ])

    expect(safes).toEqual([
      { address: first, chainIds: ['1', '10'] },
      { address: second, chainIds: ['1'] },
    ])
  })
})

describe('filterAssetsSafes', () => {
  const first = address()
  const second = address()
  const safes = [
    { address: first, chainIds: ['1', '10'] },
    { address: second, chainIds: ['137'] },
  ]

  it('keeps every Safe and network without filters', () => {
    expect(filterAssetsSafes(safes, NO_ASSETS_FILTERS)).toEqual(safes)
  })

  it('keeps only the chosen Safes', () => {
    expect(filterAssetsSafes(safes, { safes: [second], chainIds: [] })).toEqual([safes[1]])
  })

  it('keeps only the chosen networks and drops the Safes left without one', () => {
    expect(filterAssetsSafes(safes, { safes: [], chainIds: ['10'] })).toEqual([{ address: first, chainIds: ['10'] }])
  })
})

describe('toHoldings', () => {
  it('turns the non-empty tokens and the positions of a Safe on a network into holdings', () => {
    const safe = address()
    const staking: Protocol = {
      protocol: 'staking',
      protocol_metadata: { name: 'Staking', icon: { url: null } },
      fiatTotal: '50',
      items: [
        {
          name: 'Staked',
          items: [
            {
              balance: '2000000',
              fiatBalance: '50',
              fiatConversion: '1',
              fiatBalance24hChange: null,
              position_type: 'staked',
              tokenInfo: {
                address: address(),
                decimals: 6,
                logoUri: '',
                name: 'USD Coin',
                symbol: 'USDC',
                type: 'ERC20',
              },
            },
          ],
        },
      ],
    }
    const balances = { fiatTotal: '15', items: [usdc('15000000', '15'), usdc('0', '0')] }

    const holdings = toHoldings(safe, '10', balances, [staking])

    expect(holdings).toEqual([
      expect.objectContaining({
        safeAddress: safe,
        chainId: '10',
        assetKey: 'USDC',
        type: 'Token',
        amount: 15,
        fiat: 15,
      }),
      expect.objectContaining({
        assetKey: 'USDC',
        isPosition: true,
        type: 'Staking',
        protocol: 'Staking',
        amount: 2,
        fiat: 50,
      }),
    ])
  })
})

describe('toHoldings with a loan', () => {
  it('counts what a loan owes as a negative amount, as its value is', () => {
    const gho = { address: address(), decimals: 18, logoUri: '', name: 'GHO', symbol: 'GHO', type: 'ERC20' as const }
    const lending: Protocol = {
      protocol: 'lending',
      protocol_metadata: { name: 'Lending', icon: { url: null } },
      fiatTotal: '-2000',
      items: [
        {
          name: 'Borrowed',
          items: [
            {
              balance: '2000000000000000000000',
              fiatBalance: '-2000',
              fiatConversion: '1',
              fiatBalance24hChange: null,
              position_type: 'loan',
              tokenInfo: gho,
            },
          ],
        },
      ],
    }

    const [loan] = toHoldings(address(), '1', undefined, [lending])

    expect(loan).toEqual(expect.objectContaining({ assetKey: 'GHO', amount: -2000, fiat: -2000 }))
  })
})

describe('summarizeHoldings', () => {
  it('sums the tokens and the positions apart', () => {
    const summary = summarizeHoldings([
      holding({ fiat: 10 }),
      holding({ fiat: 5 }),
      holding({ fiat: 20, isPosition: true }),
    ])

    expect(summary).toEqual({ tokens: 15, positions: 20 })
  })
})

describe('aggregateReports', () => {
  it('is loading while a network has no report or waits for its turn', () => {
    const result = aggregateReports([{ state: 'ready', holdings: [] }, undefined, { state: 'pending' }])

    expect(result).toEqual({ isLoading: true, loadingCount: 2, isPartial: false })
  })

  it('is partial when a network failed, is unsupported or left out its positions', () => {
    expect(aggregateReports([{ state: 'error' }]).isPartial).toBe(true)
    expect(aggregateReports([{ state: 'unsupported' }]).isPartial).toBe(true)
    expect(aggregateReports([{ state: 'ready', holdings: [], isPartial: true }]).isPartial).toBe(true)
  })
})

describe('searchHoldings', () => {
  const ether = holding({ name: 'Ether', symbol: 'ETH' })
  const usdCoin = holding({ name: 'USD Coin', symbol: 'USDC', assetKey: 'USDC' })

  it('keeps the holdings whose asset matches every word, ignoring case', () => {
    expect(searchHoldings([ether, usdCoin], 'usd coin', () => [])).toEqual([usdCoin])
  })

  it('matches the Safe and network names it is given', () => {
    const describe = (item: AssetHolding) => (item === ether ? ['Treasury', 'Ethereum'] : ['Ops', 'Gnosis Chain'])

    expect(searchHoldings([ether, usdCoin], 'treasury', describe)).toEqual([ether])
  })

  it('keeps every holding without a search', () => {
    expect(searchHoldings([ether, usdCoin], '  ', () => [])).toEqual([ether, usdCoin])
  })
})

describe('groupHoldings', () => {
  const treasury = address()
  const ops = address()
  const holdings = [
    holding({ safeAddress: treasury, chainId: '1', amount: 1.5, fiat: 4500 }),
    holding({ safeAddress: ops, chainId: '10', amount: 0.5, fiat: 1500 }),
    holding({ safeAddress: treasury, chainId: '1', assetKey: 'USDC', symbol: 'USDC', amount: 4500, fiat: 4500.5 }),
  ]

  it('sums each asset across Safes and networks, highest value first', () => {
    const groups = groupHoldings(holdings, 'asset')

    expect(groups.map(({ key, amount, fiat, chainIds }) => ({ key, amount, fiat, chainIds }))).toEqual([
      { key: 'ETH', amount: 2, fiat: 6000, chainIds: ['1', '10'] },
      { key: 'USDC', amount: 4500, fiat: 4500.5, chainIds: ['1'] },
    ])
  })

  it('groups by Safe, ignoring the address case', () => {
    const groups = groupHoldings(holdings, 'safe')

    expect(groups.map(({ key, rows }) => [key, rows.length])).toEqual([
      [treasury.toLowerCase(), 2],
      [ops.toLowerCase(), 1],
    ])
  })

  it('groups by network', () => {
    const groups = groupHoldings(holdings, 'network')

    expect(groups.map(({ key }) => key)).toEqual(['1', '10'])
  })

  it('sums the same token of several Safes on a network into one row of the asset', () => {
    const safes = Array.from({ length: 5 }, () => address())
    const sameToken = safes.map((safeAddress) => holding({ safeAddress, chainId: '1', amount: 1, fiat: 3000 }))

    const [eth] = groupHoldings([...sameToken, holding({ chainId: '10', amount: 0.5, fiat: 1500 })], 'asset')

    expect(
      eth.rows.map(({ chainIds, safeAddresses, amount, fiat }) => ({
        chainIds,
        safes: safeAddresses.length,
        amount,
        fiat,
      })),
    ).toEqual([
      { chainIds: ['1'], safes: 5, amount: 5, fiat: 15000 },
      { chainIds: ['10'], safes: 1, amount: 0.5, fiat: 1500 },
    ])
  })

  it('keeps a position apart from the token it holds', () => {
    const safeAddress = address()

    const [eth] = groupHoldings(
      [holding({ safeAddress }), holding({ safeAddress, isPosition: true, type: 'Staked', protocol: 'Staking' })],
      'asset',
    )

    expect(eth.rows.map(({ type }) => type)).toEqual(['Token', 'Staked'])
  })

  it('sums an asset across the networks of a Safe when grouped by Safe', () => {
    const safeAddress = address()

    const [safe] = groupHoldings(
      [
        holding({ safeAddress, chainId: '1', amount: 1, fiat: 10 }),
        holding({ safeAddress, chainId: '10', amount: 2, fiat: 20 }),
      ],
      'safe',
    )

    expect(safe.rows).toEqual([expect.objectContaining({ chainIds: ['1', '10'], amount: 3, fiat: 30 })])
  })

  it('puts tokens before positions when grouped by type, whatever their values', () => {
    const groups = groupHoldings(
      [holding({ fiat: 1 }), holding({ isPosition: true, type: 'Staked', protocol: 'Staking', fiat: 100 })],
      'type',
    )

    expect(groups.map(({ key, fiat }) => [key, fiat])).toEqual([
      ['tokens', 1],
      ['positions', 100],
    ])
  })
})
