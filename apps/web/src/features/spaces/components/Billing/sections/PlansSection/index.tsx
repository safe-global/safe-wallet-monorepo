import { type ReactElement, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { useBillingData } from '../../BillingDataContext'
import type { BillingPeriod } from '../../types'
import { getUsageStatus } from '../SubscriptionSection/getUsageStatus'
import BillingPeriodToggle from './BillingPeriodToggle'
import PlanCard from './PlanCard'
import css from './styles.module.css'

/** Billing-period toggle + the per-group plan cards. Purchase wiring is not yet implemented (CTAs are no-ops). */
const PlansSection = (): ReactElement => {
  const { planGroups, subscription, subscriptionUsage } = useBillingData()
  const [period, setPeriod] = useState<BillingPeriod>('monthly')

  const status = subscription && subscriptionUsage ? getUsageStatus(subscriptionUsage, subscription) : null
  const currentPlanId = status ? subscription?.planId : undefined

  return (
    <section className={css.section} data-testid="billing-plans-section">
      <div className={css.header}>
        <h2 className={css.title}>Plans</h2>
        <div className={css.headerRow}>
          <a className={css.compareLink} href="#compare-plans">
            Compare all features
            <ArrowUpRight size={16} />
          </a>
          <BillingPeriodToggle value={period} onChange={setPeriod} />
        </div>
      </div>

      <div className={css.cardsRow}>
        {planGroups.map((group) => (
          <PlanCard
            key={group.id}
            group={group}
            period={period}
            currentPlanId={currentPlanId}
            status={status}
            hasSubscription={subscription != null}
          />
        ))}
      </div>
    </section>
  )
}

export default PlansSection
