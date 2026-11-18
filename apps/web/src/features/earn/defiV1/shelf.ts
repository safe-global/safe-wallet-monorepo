import type {
  AssetType,
  DefiV1Plan,
  GroupBy,
  Holding,
  Operation,
  Opportunity,
  OpportunityCategory,
  Position,
  Sort,
} from './types'

export const CATEGORY_ORDER: OpportunityCategory[] = ['cash', 'yield', 'staking']
export const MAX_SHELF = 7
export const NUDGE_MAX_EXIT_HOURS = 24

/** Rank by how fast the money comes back. Placement and APY never move an item up. */
export const byExitTime = (a: Opportunity, b: Opportunity): number =>
  a.exitHours - b.exitHours || a.name.localeCompare(b.name)

export const ASSET_TYPE_ORDER: AssetType[] = ['lending', 'rwa', 'staking']

const SORT_VALUE: Record<
  Sort['key'],
  (item: Opportunity, positionOf: (item: Opportunity) => number) => number | string
> = {
  name: (item) => item.name.toLowerCase(),
  apy: (item) => item.apy,
  type: (item) => ASSET_TYPE_ORDER.indexOf(item.type),
  exit: (item) => item.exitHours,
  position: (item, positionOf) => positionOf(item),
}

/** Sorts a copy by one column. Ties keep the input order. */
export const sortOpportunities = (
  opportunities: Opportunity[],
  sort: Sort,
  positionOf: (item: Opportunity) => number = () => 0,
): Opportunity[] => {
  const value = (item: Opportunity) => SORT_VALUE[sort.key](item, positionOf)
  const sign = sort.direction === 'asc' ? 1 : -1
  return [...opportunities].sort((a, b) => {
    const left = value(a)
    const right = value(b)
    if (left === right) return 0
    return (left < right ? -1 : 1) * sign
  })
}

export const isLocked = (opportunity: Opportunity, plan: DefiV1Plan): boolean =>
  plan === 'free' && opportunity.access === 'pro'

export type ShelfGroup = { category: OpportunityCategory; items: Opportunity[] }

export const buildShelf = (opportunities: Opportunity[]): { groups: ShelfGroup[]; more: Opportunity[] } => {
  const shelf = opportunities
    .filter((item) => item.onShelf)
    .sort(byExitTime)
    .slice(0, MAX_SHELF)
  const groups = CATEGORY_ORDER.map((category) => ({
    category,
    items: shelf.filter((item) => item.category === category),
  })).filter((group) => group.items.length > 0)
  const more = opportunities.filter((item) => !shelf.includes(item)).sort(byExitTime)
  return { groups, more }
}

/** What the idle-cash prompt may point to: cash-like, same-day exit, open to this Safe, and never a paid slot. */
export const nudgeOptions = (opportunities: Opportunity[], plan: DefiV1Plan): Opportunity[] =>
  opportunities
    .filter(
      (item) =>
        item.category === 'cash' &&
        item.exitHours <= NUDGE_MAX_EXIT_HOURS &&
        item.placement === 'base' &&
        !isLocked(item, plan),
    )
    .sort(byExitTime)

export type ListFilters = {
  assets: string[]
  chains: string[]
  sameDay: boolean
  openOnly: boolean
  investedOnly: boolean
}

export const NO_FILTERS: ListFilters = {
  assets: [],
  chains: [],
  sameDay: false,
  openOnly: false,
  investedOnly: false,
}

export const activeFilterCount = (filters: ListFilters): number =>
  filters.assets.length +
  filters.chains.length +
  Number(filters.sameDay) +
  Number(filters.openOnly) +
  Number(filters.investedOnly)

/** Keeps the input order. Values inside one filter widen the match, separate filters narrow it. */
export const filterOpportunities = (
  opportunities: Opportunity[],
  filters: ListFilters,
  investedIds: string[] = [],
): Opportunity[] =>
  opportunities.filter(
    (item) =>
      (!filters.investedOnly || investedIds.includes(item.id)) &&
      (filters.assets.length === 0 || filters.assets.includes(item.asset)) &&
      (filters.chains.length === 0 || item.chains.some((chain) => filters.chains.includes(chain))) &&
      (!filters.sameDay || item.exitHours <= NUDGE_MAX_EXIT_HOURS) &&
      (!filters.openOnly || (item.access === 'all' && !item.kyc)),
  )

/** Keeps the input order inside each group. Investments come first, assets in order of first appearance. */
export const groupOpportunities = (
  opportunities: Opportunity[],
  groupBy: GroupBy,
): { key: string; items: Opportunity[] }[] => {
  if (groupBy === 'none') return [{ key: 'all', items: opportunities }]
  return [...new Set(opportunities.map((item) => item.asset))].map((key) => ({
    key,
    items: opportunities.filter((item) => item.asset === key),
  }))
}

/** Moves investments to the top and keeps the input order otherwise. */
export const investedFirst = (opportunities: Opportunity[], investedIds: string[]): Opportunity[] => [
  ...opportunities.filter((item) => investedIds.includes(item.id)),
  ...opportunities.filter((item) => !investedIds.includes(item.id)),
]

/** What an operation can still invest before the main Safe tops it up. */
export const budgetLeft = (operation: Pick<Operation, 'budget' | 'invested'>): number =>
  Math.max(operation.budget - operation.invested, 0)

/** Operations allowed to invest in this option. */
export const operationsFor = (operations: Operation[], opportunityId: string): Operation[] =>
  operations.filter((operation) => operation.opportunityIds.includes(opportunityId))

export const dedicatedSafeName = (opportunity: Pick<Opportunity, 'name'>): string => `${opportunity.name} Safe`

/** The dedicated Safe that already holds money in this option, if any. */
export const heldIn = (operations: Operation[], opportunityId: string): Operation | undefined =>
  operationsFor(operations, opportunityId).find((operation) => operation.invested > 0)

export type DepositRoute = 'deposit' | 'swap' | 'bridge'

/** What the Safe has to do before it can deposit, which sets the row button label. */
export const depositRoute = (opportunity: Opportunity, from: { asset: string; chain: string }): DepositRoute => {
  if (from.asset !== opportunity.asset) return 'swap'
  if (!opportunity.chains.includes(from.chain)) return 'bridge'
  return 'deposit'
}

/** The calls one proposal bundles when the Safe holds the asset on another chain. */
export const depositSteps = (
  opportunity: Opportunity,
  from: { asset: string; chain: string },
  amount: string,
): string[] => {
  const target = opportunity.chains.includes(from.chain) ? from.chain : opportunity.chains[0]
  return [
    ...(from.chain !== target ? [`Bridge ${amount} ${from.asset} from ${from.chain} to ${target}`] : []),
    ...(from.asset !== opportunity.asset ? [`Swap ${from.asset} to ${opportunity.asset}`] : []),
    `Allow ${opportunity.name} to use ${amount} ${opportunity.asset}`,
    `Deposit ${amount} ${opportunity.asset} into ${opportunity.name} on ${target}`,
  ]
}

export type TreasurySummary = {
  total: number
  invested: number
  idle: number
  investedShare: number
  earned: number
}

/** Pending deposits still sit in the Safe, so they count as idle until signers approve them. */
export const summariseTreasury = (
  total: number,
  positions: { principal: number; earned: number; pending: boolean }[],
): TreasurySummary => {
  const live = positions.filter((position) => !position.pending)
  const invested = live.reduce((sum, position) => sum + position.principal, 0)
  const earned = live.reduce((sum, position) => sum + position.earned, 0)
  return {
    total,
    invested,
    idle: Math.max(total - invested, 0),
    investedShare: total > 0 ? invested / total : 0,
    earned,
  }
}

/** Adds up every position in one opportunity. Deposits awaiting signatures count as pending, not invested. */
export const holdingsFor = (positions: Position[], opportunityId: string): Holding | undefined => {
  const mine = positions.filter((position) => position.opportunity.id === opportunityId)
  if (mine.length === 0) return undefined
  return mine.reduce<Holding>(
    (total, position) => ({
      invested: total.invested + (position.pending ? 0 : position.principal),
      pending: total.pending + (position.pending ? position.principal : 0),
      earned: total.earned + position.earned,
    }),
    { invested: 0, pending: 0, earned: 0 },
  )
}

export type Slice = { label: string; value: number }

const byValue = (a: Slice, b: Slice) => b.value - a.value

/** Splits the idle total across assets by their share, so the breakdown always adds up to the total shown. */
export const idleByAsset = (idle: number, mix: { asset: string; share: number }[]): Slice[] =>
  mix.map(({ asset, share }) => ({ label: asset, value: idle * share })).sort(byValue)

/** Earnings per investment, live positions only, so the slices add up to the earned total. */
export const earnedByInvestment = (
  positions: { opportunity: { name: string }; earned: number; pending: boolean }[],
): Slice[] => {
  const totals = new Map<string, number>()
  for (const { opportunity, earned, pending } of positions) {
    if (pending || earned <= 0) continue
    totals.set(opportunity.name, (totals.get(opportunity.name) ?? 0) + earned)
  }
  return [...totals].map(([label, value]) => ({ label, value })).sort(byValue)
}
