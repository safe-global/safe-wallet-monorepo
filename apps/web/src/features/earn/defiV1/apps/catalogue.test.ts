import type { SafeApp } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import { buildRows, groupApps, jobOf, type AppRow, type AppsGroupBy } from './catalogue'

const app = (id: number, name: string, overrides: Partial<SafeApp> = {}): SafeApp =>
  ({
    id,
    name,
    url: `https://${id}.example`,
    iconUrl: '',
    description: `${name} description`,
    chainIds: ['1'],
    tags: [],
    features: [],
    socialProfiles: [],
    developerWebsite: '',
    accessControl: { type: 'NO_RESTRICTIONS' },
    ...overrides,
  }) as unknown as SafeApp

const AAVE = app(1, 'Aave v3', { chainIds: ['1', '137'] })
const COW = app(58, 'CowSwap', { features: ['BATCHED_TRANSACTIONS'] as SafeApp['features'] })
const BUILDER = app(24, 'Transaction Builder')
const UNKNOWN = app(99, 'Mystery app', { chainIds: ['100'] })
const CUSTOM = app(-1, 'My app')

const rows = (overrides: Partial<Parameters<typeof buildRows>[0]> = {}) =>
  buildRows({
    filteredApps: [AAVE, COW, BUILDER, UNKNOWN],
    customApps: [CUSTOM],
    query: '',
    categories: [],
    batchOnly: false,
    ...overrides,
  })

const group = (list: AppRow[], groupBy: AppsGroupBy, pinned: number[] = []) =>
  groupApps(list, groupBy, {
    pinnedIds: new Set(pinned),
    jobTitle: (job) => job,
    chainName: (id) => `chain ${id}`,
    currentChainId: '1',
    titles: { safe: 'Built into Safe', pinned: 'Pinned', others: 'All apps', custom: 'Custom apps' },
  })

const names = (list: AppRow[]) => list.map((row) => row.name)

describe('jobOf', () => {
  it('uses the profile first, then the tags', () => {
    expect(jobOf(AAVE)).toBe('grow')
    expect(jobOf(app(5, 'Unlisted', { tags: ['DAO Tooling'] }))).toBe('govern')
    expect(jobOf(UNKNOWN)).toBe('more')
  })
})

describe('buildRows', () => {
  it('adds built-in features and custom apps', () => {
    expect(names(rows())).toEqual([
      'Invest',
      'Swap',
      'Bridge',
      'Aave v3',
      'CowSwap',
      'Transaction Builder',
      'Mystery app',
      'My app',
    ])
  })

  it('searches built-ins and custom apps by name and description', () => {
    expect(names(rows({ filteredApps: [], query: 'swap' }))).toEqual(['Swap'])
    expect(names(rows({ filteredApps: [], query: 'my' }))).toEqual(['My app'])
  })

  it('hides built-ins when a category or the batch filter is on', () => {
    expect(names(rows({ filteredApps: [COW], customApps: [], batchOnly: true }))).toEqual(['CowSwap'])
    expect(names(rows({ filteredApps: [], customApps: [], categories: ['DeFi'] }))).toEqual([])
  })
})

describe('groupApps', () => {
  it('puts built-ins in their own group first and custom apps last', () => {
    const groups = group(rows(), 'job')
    expect(groups.map((item) => item.key)).toEqual(['safe', 'grow', 'trade', 'build', 'more', 'custom'])
    expect(names(groups[0].rows)).toEqual(['Invest', 'Swap', 'Bridge'])
    expect(names(groups[1].rows)).toEqual(['Aave v3'])
    expect(names(groups[2].rows)).toEqual(['CowSwap'])
  })

  it.each<AppsGroupBy>(['network', 'pinned'])('keeps built-ins on top when grouped by %s', (groupBy) => {
    const groups = group(rows(), groupBy)
    expect(groups[0].key).toBe('safe')
    expect(
      groups
        .slice(1)
        .flatMap((item) => item.rows)
        .some((row) => row.builtIn),
    ).toBe(false)
  })

  it('orders apps by users within a group', () => {
    const groups = group(rows({ filteredApps: [BUILDER, app(36, 'Drain Account')] }), 'job')
    expect(names(groups.find((item) => item.key === 'build')!.rows)).toEqual(['Transaction Builder', 'Drain Account'])
  })

  it('lists an app under every network it runs on, current network first', () => {
    const groups = group(rows({ customApps: [] }), 'network')
    expect(groups[1].key).toBe('chain-1')
    expect(names(groups.find((item) => item.key === 'chain-137')!.rows)).toEqual(['Aave v3'])
  })

  it('puts pinned apps in their own group', () => {
    const groups = group(rows(), 'pinned', [58])
    expect(groups.map((item) => item.key)).toEqual(['safe', 'pinned', 'others', 'custom'])
    expect(names(groups[1].rows)).toEqual(['CowSwap'])
  })
})
