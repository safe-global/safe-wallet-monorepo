import { TRIAL_ENDING_SOON_DAYS, trialLabel } from '../../hooks/billing/subscription'
import { TRIAL_DISCLAIMER } from '../../constants'
import type { CurrentBadge } from './PlanCards'
import type { Meter, PlanSummary } from '@views/features/spaces/components/Plans/types'
import { PlanStatusCardView } from '@views/features/spaces/components/Plans/PlanStatusCardView'

export { _remaining, InfoTip, seatsTooltip } from '@views/features/spaces/components/Plans/PlanStatusCardView'

/** The badge both the status card and the current plan card wear: trial with its countdown, or Active. */
export const getCurrentBadge = (plan: PlanSummary | null): CurrentBadge | undefined => {
  if (!plan) return undefined
  if (plan.status === 'active') return { label: 'Active', variant: 'brand' }
  const endingSoon = plan.daysLeft !== null && plan.daysLeft <= TRIAL_ENDING_SOON_DAYS
  return {
    label: trialLabel(plan.daysLeft),
    variant: endingSoon ? 'warning' : 'brand',
  }
}

export default function PlanStatusCard({
  plan,
  safeAccounts,
  sponsoredTxs,
  tierName,
  onManage,
  isManaging,
  canManage = plan?.status === 'active',
}: {
  plan: PlanSummary | null
  safeAccounts: Meter | null
  sponsoredTxs: Meter | null
  tierName?: string
  onManage?: () => void
  isManaging?: boolean
  /** Shows "Manage plan": on by default for a paid plan, and worth keeping for a lapsed one that still has a Stripe portal. */
  canManage?: boolean
}) {
  return (
    <PlanStatusCardView
      plan={plan}
      safeAccounts={safeAccounts}
      sponsoredTxs={sponsoredTxs}
      tierName={tierName}
      onManage={onManage}
      isManaging={isManaging}
      canManage={canManage}
      badge={getCurrentBadge(plan)}
      trialDisclaimer={TRIAL_DISCLAIMER}
    />
  )
}
