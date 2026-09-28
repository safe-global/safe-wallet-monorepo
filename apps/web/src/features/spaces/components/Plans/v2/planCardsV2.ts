import { ENTERPRISE_TIER } from '../planCatalog'
import { getPlanCta } from '../planTiers'
import type { CurrentPlan, PlanCta, PlanPick, PlanTier } from '../types'

/** v2 moves "Manage plan" to the status panel: the current card reads as current, Enterprise changes go through sales. */
export type PlanCtaV2 =
  | Exclude<PlanCta, { kind: 'manage' }>
  | { kind: 'current'; label: 'Current plan' }
  | { kind: 'account-team'; label: 'Change via your account team' }

export const getPlanCtaV2 = (pick: PlanPick, current: CurrentPlan | undefined, recommended?: string): PlanCtaV2 => {
  if (pick.tier.isCurrent && pick.tier.name === ENTERPRISE_TIER.name) {
    return { kind: 'account-team', label: 'Change via your account team' }
  }
  const cta = getPlanCta(pick, current, recommended)
  return cta.kind === 'manage' ? { kind: 'current', label: 'Current plan' } : cta
}

/** An Enterprise subscription has its own current card, so the static sales card would repeat it. */
export const getTiersV2 = (tiers: PlanTier[]): PlanTier[] => {
  const hasCurrentEnterprise = tiers.some((tier) => tier.isCurrent && tier.name === ENTERPRISE_TIER.name)
  return hasCurrentEnterprise ? tiers.filter((tier) => tier !== ENTERPRISE_TIER) : tiers
}
