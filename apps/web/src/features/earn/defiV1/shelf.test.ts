import { faker } from '@faker-js/faker'
import {
  activeFilterCount,
  budgetLeft,
  buildShelf,
  dedicatedSafeName,
  depositRoute,
  depositSteps,
  filterOpportunities,
  groupOpportunities,
  heldIn,
  holdingsFor,
  investedFirst,
  isLocked,
  idleByAsset,
  earnedByInvestment,
  NO_FILTERS,
  operationsFor,
  MAX_SHELF,
  nudgeOptions,
  sortOpportunities,
  summariseTreasury,
} from './shelf'
import type { Opportunity } from './types'

const opportunity = (overrides: Partial<Opportunity> = {}): Opportunity => ({
  id: faker.string.uuid(),
  name: faker.company.name(),
  mark: 'X',
  runBy: faker.company.name(),
  category: 'cash',
  type: 'lending',
  risk: 'low',
  asset: 'USDC',
  holds: faker.lorem.words(3),
  apy: faker.number.float({ min: 0.01, max: 0.08 }),
  exitLabel: faker.lorem.words(2),
  exitShort: faker.lorem.word(),
  exitHours: 0,
  audits: [faker.company.name()],
  liveSince: '2024-01',
  chains: ['Ethereum'],
  kyc: false,
  access: 'all',
  placement: 'base',
  onShelf: true,
  tvl: faker.number.int({ min: 1_000_000, max: 1_000_000_000 }),
  managementFee: 0,
  protocolFee: faker.lorem.words(2),
  yieldSource: faker.lorem.sentence(),
  operators: faker.company.name(),
  ...overrides,
})

describe('buildShelf', () => {
  it('keeps at most seven items on the shelf and moves the rest behind "More"', () => {
    const items = Array.from({ length: 10 }, () => opportunity())

    const { groups, more } = buildShelf(items)

    expect(groups.flatMap((group) => group.items)).toHaveLength(MAX_SHELF)
    expect(more).toHaveLength(3)
  })

  it('ranks a premium high-APY listing below a faster-exit base listing in the same category', () => {
    const premium = opportunity({ exitHours: 72, placement: 'premium', apy: 0.09 })
    const base = opportunity({ exitHours: 0, placement: 'base', apy: 0.02 })

    const { groups } = buildShelf([premium, base])

    expect(groups[0].items).toEqual([base, premium])
  })

  it('orders groups cash-like, then enhanced yield, then staking', () => {
    const items = [opportunity({ category: 'staking' }), opportunity({ category: 'yield' }), opportunity()]

    const { groups } = buildShelf(items)

    expect(groups.map((group) => group.category)).toEqual(['cash', 'yield', 'staking'])
  })
})

describe('nudgeOptions', () => {
  it('never suggests a featured, premium or sponsored listing', () => {
    const paid = (['featured', 'premium', 'sponsored'] as const).map((placement) => opportunity({ placement }))
    const base = opportunity()

    expect(nudgeOptions([...paid, base], 'pro')).toEqual([base])
  })

  it('leaves out options that take longer than a day to exit', () => {
    const slow = opportunity({ exitHours: 72 })

    expect(nudgeOptions([slow], 'pro')).toEqual([])
  })

  it('leaves out Pro-only options for a free Safe', () => {
    const proOnly = opportunity({ access: 'pro' })

    expect(nudgeOptions([proOnly], 'free')).toEqual([])
  })
})

describe('isLocked', () => {
  it('locks a Pro-only listing for a free Safe', () => {
    expect(isLocked(opportunity({ access: 'pro' }), 'free')).toBe(true)
  })

  it('opens Pro-only listings on Safe Pro', () => {
    expect(isLocked(opportunity({ access: 'pro' }), 'pro')).toBe(false)
  })
})

describe('sortOpportunities', () => {
  it('sorts by net APY, highest first', () => {
    const low = opportunity({ apy: 0.02 })
    const high = opportunity({ apy: 0.06 })

    expect(sortOpportunities([low, high], { key: 'apy', direction: 'desc' })).toEqual([high, low])
  })

  it('sorts by asset type in a fixed order', () => {
    const staking = opportunity({ type: 'staking' })
    const lending = opportunity({ type: 'lending' })
    const rwa = opportunity({ type: 'rwa' })

    expect(sortOpportunities([staking, rwa, lending], { key: 'type', direction: 'asc' })).toEqual([
      lending,
      rwa,
      staking,
    ])
  })

  it('sorts by position size from the lookup', () => {
    const small = opportunity({ id: 'small' })
    const big = opportunity({ id: 'big' })
    const sizes: Record<string, number> = { small: 10, big: 500 }

    expect(sortOpportunities([small, big], { key: 'position', direction: 'desc' }, (item) => sizes[item.id])).toEqual([
      big,
      small,
    ])
  })

  it('keeps ties in the input order and leaves the input untouched', () => {
    const first = opportunity({ exitHours: 24 })
    const second = opportunity({ exitHours: 24 })
    const items = [first, second]

    expect(sortOpportunities(items, { key: 'exit', direction: 'desc' })).toEqual([first, second])
    expect(items).toEqual([first, second])
  })
})

describe('earnedByInvestment', () => {
  it('sums earnings per investment, largest first, skipping pending and zero', () => {
    const aave = opportunity({ name: 'Aave' })
    const lido = opportunity({ name: 'Lido' })
    expect(
      earnedByInvestment([
        { opportunity: aave, earned: 10, pending: false },
        { opportunity: lido, earned: 30, pending: false },
        { opportunity: aave, earned: 5, pending: false },
        { opportunity: lido, earned: 99, pending: true },
        { opportunity: opportunity({ name: 'New' }), earned: 0, pending: false },
      ]),
    ).toEqual([
      { label: 'Lido', value: 30 },
      { label: 'Aave', value: 15 },
    ])
  })
})

describe('idleByAsset', () => {
  it('splits the idle total by share, largest first', () => {
    expect(
      idleByAsset(1_000, [
        { asset: 'ETH', share: 0.3 },
        { asset: 'USDC', share: 0.7 },
      ]),
    ).toEqual([
      { label: 'USDC', value: 700 },
      { label: 'ETH', value: 300 },
    ])
  })
})

describe('filterOpportunities', () => {
  it('keeps only options that exit within a day', () => {
    const fast = opportunity({ exitHours: 0 })
    const slow = opportunity({ exitHours: 120 })

    expect(filterOpportunities([fast, slow], { ...NO_FILTERS, sameDay: true })).toEqual([fast])
  })

  it('matches any chosen value inside a filter and every filter together', () => {
    const usdcBase = opportunity({ asset: 'USDC', chains: ['Base'] })
    const ethBase = opportunity({ asset: 'ETH', chains: ['Base'] })
    const usdcEthereum = opportunity({ asset: 'USDC', chains: ['Ethereum'] })

    const filters = { ...NO_FILTERS, assets: ['USDC', 'DAI'], chains: ['Base'] }

    expect(filterOpportunities([usdcBase, ethBase, usdcEthereum], filters)).toEqual([usdcBase])
  })

  it('treats a KYC listing as not open to all', () => {
    const open = opportunity()
    const kyc = opportunity({ kyc: true })

    expect(filterOpportunities([open, kyc], { ...NO_FILTERS, openOnly: true })).toEqual([open])
  })

  it('keeps only options the Safe has invested in', () => {
    const held = opportunity()
    const other = opportunity()

    expect(filterOpportunities([held, other], { ...NO_FILTERS, investedOnly: true }, [held.id])).toEqual([held])
  })

  it('counts each chosen value as one active filter', () => {
    expect(activeFilterCount({ ...NO_FILTERS, assets: ['USDC', 'ETH'], sameDay: true })).toBe(3)
  })
})

describe('groupOpportunities', () => {
  it('returns one group in the input order when not grouping', () => {
    const items = [opportunity(), opportunity()]

    expect(groupOpportunities(items, 'none')).toEqual([{ key: 'all', items }])
  })

  it('orders asset groups by first appearance', () => {
    const eth = opportunity({ asset: 'ETH' })
    const usdc = opportunity({ asset: 'USDC' })

    expect(groupOpportunities([eth, usdc, opportunity({ asset: 'ETH' })], 'asset').map((group) => group.key)).toEqual([
      'ETH',
      'USDC',
    ])
  })
})

describe('groupOpportunities by type and network', () => {
  it('groups by asset type', () => {
    const lending = opportunity({ type: 'lending' })
    const staking = opportunity({ type: 'staking' })

    expect(groupOpportunities([lending, staking], 'type')).toEqual([
      { key: 'lending', items: [lending] },
      { key: 'staking', items: [staking] },
    ])
  })

  it('lists a multi-network opportunity under each network', () => {
    const both = opportunity({ chains: ['Ethereum', 'Base'] })
    const base = opportunity({ chains: ['Base'] })

    expect(groupOpportunities([both, base], 'network')).toEqual([
      { key: 'Ethereum', items: [both] },
      { key: 'Base', items: [both, base] },
    ])
  })
})

describe('investedFirst', () => {
  it('moves investments to the top and keeps the rest in order', () => {
    const [first, second, held] = [opportunity(), opportunity(), opportunity()]

    expect(investedFirst([first, second, held], [held.id])).toEqual([held, first, second])
  })
})

describe('operations', () => {
  const operation = { budget: 1_000, invested: 400, opportunityIds: ['a'] }

  it('reports what an operation can still invest', () => {
    expect(budgetLeft(operation)).toBe(600)
  })

  it('never reports a negative budget', () => {
    expect(budgetLeft({ budget: 100, invested: 300 })).toBe(0)
  })

  it('lists only operations approved for the option', () => {
    const allowed = { ...operation, id: 'one', name: 'One', threshold: 1, owners: 3 }
    const other = { ...allowed, id: 'two', opportunityIds: ['b'] }

    expect(operationsFor([allowed, other], 'a')).toEqual([allowed])
  })

  it('names a dedicated Safe after its investment', () => {
    expect(dedicatedSafeName({ name: 'Aave USDC' })).toBe('Aave USDC Safe')
  })

  it('finds the dedicated Safe that holds money in an option', () => {
    const empty = {
      id: 'empty',
      name: 'Empty',
      budget: 100,
      invested: 0,
      threshold: 1,
      owners: 3,
      opportunityIds: ['a'],
    }
    const funded = { ...empty, id: 'funded', invested: 50 }

    expect(heldIn([empty, funded], 'a')).toEqual(funded)
    expect(heldIn([empty], 'a')).toBeUndefined()
  })
})

describe('depositRoute', () => {
  it('needs a swap when the Safe holds another asset', () => {
    expect(depositRoute(opportunity({ asset: 'ETH' }), { asset: 'USDC', chain: 'Ethereum' })).toBe('swap')
  })

  it('needs a bridge when the asset sits on another chain', () => {
    expect(depositRoute(opportunity({ asset: 'USDC', chains: ['Ethereum'] }), { asset: 'USDC', chain: 'Base' })).toBe(
      'bridge',
    )
  })

  it('deposits directly when asset and chain match', () => {
    expect(depositRoute(opportunity({ asset: 'USDC', chains: ['Base'] }), { asset: 'USDC', chain: 'Base' })).toBe(
      'deposit',
    )
  })
})

describe('depositSteps', () => {
  it('adds a bridge step when the Safe holds the asset on a chain the option does not support', () => {
    const vault = opportunity({ name: 'Vault', chains: ['Ethereum'] })

    const steps = depositSteps(vault, { asset: 'USDC', chain: 'Base' }, '400,000')

    expect(steps).toEqual([
      'Bridge 400,000 USDC from Base to Ethereum',
      'Allow Vault to use 400,000 USDC',
      'Deposit 400,000 USDC into Vault on Ethereum',
    ])
  })

  it('skips the bridge when the option runs on the chain the Safe holds the asset on', () => {
    const vault = opportunity({ chains: ['Ethereum', 'Base'] })

    const steps = depositSteps(vault, { asset: 'USDC', chain: 'Base' }, '1')

    expect(steps).toHaveLength(2)
  })
})

describe('summariseTreasury', () => {
  const position = (principal: number, earned: number, pending = false) => ({ principal, earned, pending })

  it('adds up live positions into invested, idle and earned', () => {
    const summary = summariseTreasury(1_000, [position(300, 5), position(100, 1)])

    expect(summary.idle).toBe(600)
    expect(summary.investedShare).toBeCloseTo(0.4)
    expect(summary.earned).toBe(6)
  })

  it('counts a deposit still waiting for signatures as idle', () => {
    const summary = summariseTreasury(1_000, [position(400, 0, true)])

    expect(summary.invested).toBe(0)
    expect(summary.idle).toBe(1_000)
  })
})

describe('holdingsFor', () => {
  it('adds up positions in one opportunity and keeps unsigned deposits apart', () => {
    const item = opportunity()
    const positions = [
      { opportunity: item, principal: 1_000, earned: 20, pending: false },
      { opportunity: item, principal: 500, earned: 0, pending: true },
      { opportunity: opportunity(), principal: 9_000, earned: 90, pending: false },
    ]

    expect(holdingsFor(positions, item.id)).toEqual({ invested: 1_000, pending: 500, earned: 20 })
  })

  it('returns nothing for an opportunity without positions', () => {
    expect(holdingsFor([], 'none')).toBeUndefined()
  })
})
