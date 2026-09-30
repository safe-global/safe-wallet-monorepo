import { ENTERPRISE_TIER, PLAN_CARD_COPY_V2 } from '../planCatalog'
import { formatPlanPrice, getPlanCta, priceSuffix } from '../planTiers'
import type { CurrentPlan, PlanCta, PlanPick, PlanSeatOption, PlanTier } from '../types'

/** v2 cards: "Manage plan" moves to the status panel, Enterprise changes go through sales. */
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

/** Show "Manage plan" in the status panel, including trials with a card on file. */
export const canManageV2 = (canManage: boolean | undefined, currentPlan: CurrentPlan | undefined): boolean =>
  Boolean(canManage || (currentPlan?.isTrialing && currentPlan.hasPaymentMethod))

/** Hide the static Enterprise card when Enterprise is the current plan. */
export const getTiersV2 = (tiers: PlanTier[]): PlanTier[] => {
  const hasCurrentEnterprise = tiers.some((tier) => tier.isCurrent && tier.name === ENTERPRISE_TIER.name)
  return hasCurrentEnterprise ? tiers.filter((tier) => tier !== ENTERPRISE_TIER) : tiers
}

export type PlanPriceV2 = { headline: string; suffix: string; line: string }

/** Same totals as the launch page: €669/mo, or the full yearly amount per year. */
export const getPlanPriceV2 = (tier: PlanTier, option: PlanSeatOption): PlanPriceV2 => {
  if (option.price === null) {
    return {
      headline: PLAN_CARD_COPY_V2.custom,
      suffix: PLAN_CARD_COPY_V2.customSuffix,
      line: PLAN_CARD_COPY_V2.customLine,
    }
  }
  return {
    headline: formatPlanPrice(option.price, tier.currency),
    suffix: priceSuffix(tier.billingCycle),
    line: tier.billingCycle === 'year' ? PLAN_CARD_COPY_V2.billedYearly : PLAN_CARD_COPY_V2.billedMonthly,
  }
}
