import { faker } from '@faker-js/faker'
import {
  activeFilterCount,
  buildShelf,
  depositSteps,
  filterOpportunities,
  groupOpportunities,
  isLocked,
  NO_FILTERS,
  MAX_SHELF,
  nudgeOptions,
  summariseTreasury,
} from './shelf'
import type { Opportunity } from './types'

const opportunity = (overrides: Partial<Opportunity> = {}): Opportunity => ({
  id: faker.string.uuid(),
  name: faker.company.name(),
  mark: 'X',
  runBy: faker.company.name(),
  category: 'cash',
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

  it('ranks a premium high-APY listing below a lower-risk base listing in the same category', () => {
    const premium = opportunity({ risk: 'medium', placement: 'premium', apy: 0.09 })
    const base = opportunity({ risk: 'low', placement: 'base', apy: 0.02 })

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

    expect(nudgeOptions([...paid, base], 'A', 'pro')).toEqual([base])
  })

  it('leaves out options that take longer than a day to exit', () => {
    const slow = opportunity({ exitHours: 72 })

    expect(nudgeOptions([slow], 'A', 'pro')).toEqual([])
  })

  it('leaves out Pro-only options for a free Safe under model A', () => {
    const proOnly = opportunity({ access: 'pro' })

    expect(nudgeOptions([proOnly], 'A', 'free')).toEqual([])
  })
})

describe('isLocked', () => {
  it('locks a Pro-only listing for a free Safe under model A', () => {
    expect(isLocked(opportunity({ access: 'pro' }), 'A', 'free')).toBe(true)
  })

  it('opens every listing under model B', () => {
    expect(isLocked(opportunity({ access: 'pro' }), 'B', 'free')).toBe(false)
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

  it('counts each chosen value as one active filter', () => {
    expect(activeFilterCount({ ...NO_FILTERS, assets: ['USDC', 'ETH'], sameDay: true })).toBe(3)
  })
})

describe('groupOpportunities', () => {
  it('returns one group in the input order when not grouping', () => {
    const items = [opportunity(), opportunity()]

    expect(groupOpportunities(items, 'none')).toEqual([{ key: 'all', items }])
  })

  it('orders risk groups from lower to higher and skips empty ones', () => {
    const higher = opportunity({ risk: 'higher' })
    const low = opportunity({ risk: 'low' })

    expect(groupOpportunities([higher, low], 'risk').map((group) => group.key)).toEqual(['low', 'higher'])
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
  const position = (principal: number, earned: number, apy: number, pending = false) => ({
    principal,
    earned,
    pending,
    opportunity: { apy },
  })

  it('weights the blended rate by the amount in each position', () => {
    const summary = summariseTreasury(1_000, [position(300, 5, 0.04), position(100, 1, 0.08)])

    expect(summary.blendedApy).toBeCloseTo(0.05)
    expect(summary.investedShare).toBeCloseTo(0.4)
    expect(summary.earned).toBe(6)
  })

  it('counts a deposit still waiting for signatures as idle', () => {
    const summary = summariseTreasury(1_000, [position(400, 0, 0.04, true)])

    expect(summary.invested).toBe(0)
    expect(summary.idle).toBe(1_000)
  })
})
