import { faker } from '@faker-js/faker'
import {
  buildShelf,
  depositSteps,
  filterOpportunities,
  isLocked,
  MAX_SHELF,
  nudgeOptions,
  summariseTreasury,
} from './shelf'
import type { Opportunity } from './types'

const opportunity = (overrides: Partial<Opportunity> = {}): Opportunity => ({
  id: faker.string.uuid(),
  name: faker.company.name(),
  runBy: faker.company.name(),
  category: 'cash',
  risk: 'low',
  asset: 'USDC',
  holds: faker.lorem.words(3),
  apy: faker.number.float({ min: 0.01, max: 0.08 }),
  exitLabel: faker.lorem.words(2),
  exitHours: 0,
  audits: [faker.company.name()],
  liveSince: '2024-01',
  chains: ['Ethereum'],
  kyc: false,
  access: 'all',
  placement: 'base',
  onShelf: true,
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
  it('keeps only options that exit within the chosen time', () => {
    const fast = opportunity({ exitHours: 0 })
    const slow = opportunity({ exitHours: 120 })

    expect(filterOpportunities([fast, slow], { maxExitHours: 24 })).toEqual([fast])
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
