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

  it('puts tokens before positions, whatever their values', () => {
    const groups = groupHoldings([
      holding({ fiat: 1 }),
      holding({ isPosition: true, type: 'Staked', protocol: 'Staking', fiat: 100 }),
    ])

    expect(groups.map(({ id, fiat }) => [id, fiat])).toEqual([
      ['tokens', 1],
      ['positions', 100],
    ])
  })

  it('sums an asset into one row across Safes and networks, highest value first', () => {
    const [tokens] = groupHoldings([
      holding({ safeAddress: treasury, chainId: '1', amount: 1, fiat: 3000 }),
      holding({ safeAddress: ops, chainId: '1', amount: 1, fiat: 3000 }),
      holding({ safeAddress: ops, chainId: '10', amount: 0.5, fiat: 1500 }),
      holding({ safeAddress: treasury, assetKey: 'USDC', symbol: 'USDC', amount: 10000, fiat: 10000 }),
    ])

    expect(tokens.rows.map(({ assetKey, amount, fiat, chainIds }) => ({ assetKey, amount, fiat, chainIds }))).toEqual([
      { assetKey: 'USDC', amount: 10000, fiat: 10000, chainIds: ['1'] },
      { assetKey: 'ETH', amount: 2.5, fiat: 7500, chainIds: ['1', '10'] },
    ])
  })

  it('lists the Safes holding an asset with their share, highest value first', () => {
    const [tokens] = groupHoldings([
      holding({ safeAddress: treasury, chainId: '1', amount: 1, fiat: 3000 }),
      holding({ safeAddress: ops, chainId: '1', amount: 1, fiat: 3000 }),
      holding({ safeAddress: ops, chainId: '10', amount: 0.5, fiat: 1500 }),
    ])

    expect(tokens.rows[0].safes).toEqual([
      { safeAddress: ops, chainIds: ['1', '10'], amount: 1.5, fiat: 4500 },
      { safeAddress: treasury, chainIds: ['1'], amount: 1, fiat: 3000 },
    ])
  })

  it('keeps each kind of position apart from the token it holds', () => {
    const groups = groupHoldings([
      holding({ safeAddress: treasury }),
      holding({ safeAddress: treasury, isPosition: true, type: 'Staked', protocol: 'Staking' }),
      holding({ safeAddress: ops, isPosition: true, type: 'Deposited', protocol: 'Lending' }),
    ])

    expect(groups.map(({ id, rows }) => [id, rows.map(({ type }) => type)])).toEqual([
      ['tokens', ['Token']],
      ['positions', ['Staked', 'Deposited']],
    ])
  })

  it('weights the 24h change of an asset by the value of each holding', () => {
    const [tokens] = groupHoldings([
      holding({ safeAddress: treasury, fiat: 3000, change: 10 }),
      holding({ safeAddress: ops, fiat: 1000, change: -10 }),
      holding({ safeAddress: ops, chainId: '10', fiat: 500 }),
    ])

    expect(tokens.rows[0].change).toBe(5)
  })

  it('has no 24h change when no holding of the asset has one', () => {
    const [tokens] = groupHoldings([holding({ fiat: 10 })])

    expect(tokens.rows[0].change).toBeUndefined()
  })

  it('leaves out a group with nothing in it', () => {
    expect(groupHoldings([holding({})]).map(({ id }) => id)).toEqual(['tokens'])
  })
})
