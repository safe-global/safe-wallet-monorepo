import { faker } from '@faker-js/faker'
import type { Protocol } from '@safe-global/store/gateway/AUTO_GENERATED/positions'
import { balanceBuilder } from '@/tests/builders/balances'
import { safeItemBuilder } from '@/tests/builders/safeItem'
import {
  aggregateReports,
  filterAssetsSafes,
  NO_ASSETS_FILTERS,
  toAssetsSafes,
  toAssetsSummary,
  toProtocolRows,
  toTokenRows,
} from './utils'

const address = () => faker.finance.ethereumAddress()

const protocol = (name: string, fiatTotal: string): Protocol => ({
  protocol: name,
  protocol_metadata: { name, icon: { url: null } },
  fiatTotal,
  items: [],
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

describe('toAssetsSummary', () => {
  it('sums the tokens and the positions apart', () => {
    const balances = { items: [], fiatTotal: '999', tokensFiatTotal: '100.5' }

    const summary = toAssetsSummary(balances, [protocol('A', '20'), protocol('B', '30')])

    expect(summary).toEqual({ tokens: 100.5, positions: 50 })
  })

  it('falls back to the fiat total when the tokens total is missing', () => {
    expect(toAssetsSummary({ items: [], fiatTotal: '42' })).toEqual({ tokens: 42, positions: 0 })
  })

  it('counts nothing without balances', () => {
    expect(toAssetsSummary(undefined)).toEqual({ tokens: 0, positions: 0 })
  })
})

describe('aggregateReports', () => {
  it('sums the loaded networks and is loading while one has no report', () => {
    const result = aggregateReports([{ state: 'ready', summary: { tokens: 10, positions: 5 } }, undefined])

    expect(result).toEqual({
      summary: { tokens: 10, positions: 5 },
      isLoading: true,
      isPartial: false,
      hasSummary: true,
    })
  })

  it('leaves the failed networks out and marks the sum as partial', () => {
    const result = aggregateReports([
      { state: 'ready', summary: { tokens: 10, positions: 0 } },
      { state: 'error' },
      { state: 'inactive', summary: { tokens: 0, positions: 0 } },
    ])

    expect(result).toEqual({
      summary: { tokens: 10, positions: 0 },
      isLoading: false,
      isPartial: true,
      hasSummary: true,
    })
  })

  it('marks the sum as partial when a loaded network left its positions out', () => {
    const result = aggregateReports([{ state: 'ready', summary: { tokens: 10, positions: 0 }, isPartial: true }])

    expect(result.isPartial).toBe(true)
  })

  it('has no sum when every network failed or is unsupported', () => {
    const result = aggregateReports([{ state: 'error' }, { state: 'unsupported' }])

    expect(result).toEqual(expect.objectContaining({ isLoading: false, isPartial: true, hasSummary: false }))
  })

  it('is loading while a network waits for its turn', () => {
    expect(aggregateReports([{ state: 'pending' }]).isLoading).toBe(true)
  })
})

describe('toTokenRows', () => {
  it('drops empty balances and sorts by value, highest first', () => {
    const small = balanceBuilder().with({ fiatBalance: '1' }).build()
    const large = balanceBuilder().with({ fiatBalance: '100' }).build()
    const empty = balanceBuilder().with({ balance: '0', fiatBalance: '0' }).build()

    const rows = toTokenRows([small, empty, large], 'USD')

    expect(rows.map((row) => row.id)).toEqual([large.tokenInfo.address, small.tokenInfo.address])
  })
})

describe('toProtocolRows', () => {
  it('sorts the protocols by value and names each position type', () => {
    const lending = protocol('Lending', '10')
    lending.items = [
      {
        name: 'Supplied',
        items: [
          {
            balance: '1000000',
            fiatBalance: '10',
            fiatConversion: '1',
            fiatBalance24hChange: null,
            position_type: 'deposit',
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
    ]

    const rows = toProtocolRows([lending, protocol('Staking', '50')], 'USD')

    expect(rows.map((row) => row.name)).toEqual(['Staking', 'Lending'])
    expect(rows[1].positions).toEqual([
      expect.objectContaining({ name: 'USD Coin', type: 'Deposited', amount: '1 USDC' }),
    ])
  })
})
