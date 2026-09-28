import { ENTERPRISE_TIER, PLAN_CARD_COPY_V2 } from '../planCatalog'
import { getPlanCta } from '../planTiers'
import type { CurrentPlan, PlanCta, PlanPick, PlanTier } from '../types'

/** v2 moves "Manage plan" to the status panel: the current card reads as current, Enterprise changes go through sales. */
export type PlanCtaV2 =
  | Exclude<PlanCta, { kind: 'manage' }>
  | { kind: 'current'; label: typeof PLAN_CARD_COPY_V2.currentPlan }
  | { kind: 'account-team'; label: typeof PLAN_CARD_COPY_V2.accountTeam }

export const getPlanCtaV2 = (pick: PlanPick, current: CurrentPlan | undefined): PlanCtaV2 => {
  if (pick.tier.isCurrent && pick.tier.name === ENTERPRISE_TIER.name) {
    return { kind: 'account-team', label: PLAN_CARD_COPY_V2.accountTeam }
  }
  const cta = getPlanCta(pick, current)
  return cta.kind === 'manage' ? { kind: 'current', label: PLAN_CARD_COPY_V2.currentPlan } : cta
}

/** Plans v2 shows "Manage plan" in the status panel whenever the card would have, a trial with a card on file included. */
export const canManageV2 = (canManage: boolean | undefined, currentPlan: CurrentPlan | undefined): boolean =>
  Boolean(canManage || (currentPlan?.isTrialing && currentPlan.hasPaymentMethod))

/** An Enterprise subscription has its own current card, so the static sales card would repeat it. */
export const getTiersV2 = (tiers: PlanTier[]): PlanTier[] => {
  const hasCurrentEnterprise = tiers.some((tier) => tier.isCurrent && tier.name === ENTERPRISE_TIER.name)
  return hasCurrentEnterprise ? tiers.filter((tier) => tier !== ENTERPRISE_TIER) : tiers
}
