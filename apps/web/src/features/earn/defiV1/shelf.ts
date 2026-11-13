import type { DefiV1Model, DefiV1Plan, Opportunity, OpportunityCategory, RiskLevel } from './types'

export const CATEGORY_ORDER: OpportunityCategory[] = ['cash', 'yield', 'staking']
export const MAX_SHELF = 7
export const NUDGE_MAX_EXIT_HOURS = 24

const RISK_ORDER: Record<RiskLevel, number> = { low: 0, medium: 1, higher: 2 }

/** Rank by risk, then exit time. Placement and APY never move an item up. */
export const byTrust = (a: Opportunity, b: Opportunity): number =>
  RISK_ORDER[a.risk] - RISK_ORDER[b.risk] || a.exitHours - b.exitHours || a.name.localeCompare(b.name)

export const isLocked = (opportunity: Opportunity, model: DefiV1Model, plan: DefiV1Plan): boolean =>
  model === 'A' && plan === 'free' && opportunity.access === 'pro'

export type ShelfGroup = { category: OpportunityCategory; items: Opportunity[] }

export const buildShelf = (opportunities: Opportunity[]): { groups: ShelfGroup[]; more: Opportunity[] } => {
  const shelf = opportunities
    .filter((item) => item.onShelf)
    .sort(byTrust)
    .slice(0, MAX_SHELF)
  const groups = CATEGORY_ORDER.map((category) => ({
    category,
    items: shelf.filter((item) => item.category === category),
  })).filter((group) => group.items.length > 0)
  const more = opportunities.filter((item) => !shelf.includes(item)).sort(byTrust)
  return { groups, more }
}

/** What the idle-cash prompt may point to: cash-like, same-day exit, open to this Safe, and never a paid slot. */
export const nudgeOptions = (opportunities: Opportunity[], model: DefiV1Model, plan: DefiV1Plan): Opportunity[] =>
  opportunities
    .filter(
      (item) =>
        item.category === 'cash' &&
        item.exitHours <= NUDGE_MAX_EXIT_HOURS &&
        item.placement === 'base' &&
        !isLocked(item, model, plan),
    )
    .sort(byTrust)

export type ListFilters = { asset?: string; chain?: string; maxExitHours?: number }

export const filterOpportunities = (opportunities: Opportunity[], filters: ListFilters): Opportunity[] =>
  opportunities
    .filter((item) => !filters.asset || item.asset === filters.asset)
    .filter((item) => !filters.chain || item.chains.includes(filters.chain))
    .filter((item) => filters.maxExitHours === undefined || item.exitHours <= filters.maxExitHours)
    .sort(byTrust)

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
  blendedApy: number
}

/** Pending deposits still sit in the Safe, so they count as idle until signers approve them. */
export const summariseTreasury = (
  total: number,
  positions: { principal: number; earned: number; pending: boolean; opportunity: Pick<Opportunity, 'apy'> }[],
): TreasurySummary => {
  const live = positions.filter((position) => !position.pending)
  const invested = live.reduce((sum, position) => sum + position.principal, 0)
  const earned = live.reduce((sum, position) => sum + position.earned, 0)
  const weighted = live.reduce((sum, position) => sum + position.principal * position.opportunity.apy, 0)
  return {
    total,
    invested,
    idle: Math.max(total - invested, 0),
    investedShare: total > 0 ? invested / total : 0,
    earned,
    blendedApy: invested > 0 ? weighted / invested : 0,
  }
}

export const fastestExitLabel = (hours: number): string => {
  if (hours === 0) return 'Exit instantly'
  if (hours <= 24) return 'Exit same day'
  if (hours <= 72) return 'Exit within 3 days'
  return 'Exit within days'
}

export type CategoryHighlight = { category: OpportunityCategory; bestApy: number; exitLabel: string; count: number }

export const categoryHighlights = (opportunities: Opportunity[]): CategoryHighlight[] =>
  buildShelf(opportunities).groups.map((group) => ({
    category: group.category,
    bestApy: Math.max(...group.items.map((item) => item.apy)),
    exitLabel: fastestExitLabel(Math.min(...group.items.map((item) => item.exitHours))),
    count: group.items.length,
  }))
