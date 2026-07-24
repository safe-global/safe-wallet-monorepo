import { type ReactElement, useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import type { BillingPeriod, PlanGroup, UsageStatus } from '../../types'
import { YEARLY_DISCOUNT } from './constants'
import css from './styles.module.css'

const STATUS_DOT_CLASS: Record<UsageStatus, string> = {
  within_limit: css.currentDotSuccess,
  approaching_limit: css.currentDotWarning,
  limit_reached: css.currentDotError,
  payment_failed: css.currentDotError,
}

const formatPrice = (priceMonthlyUsd: number, period: BillingPeriod): string => {
  const price = period === 'yearly' ? Math.round(priceMonthlyUsd * YEARLY_DISCOUNT) : priceMonthlyUsd
  return `$${price.toLocaleString('en-US')}`
}

const PlanCard = ({
  group,
  period,
  currentPlanId,
  status,
  hasSubscription = true,
  onSelectPlan,
}: {
  group: PlanGroup
  period: BillingPeriod
  currentPlanId?: string
  status?: UsageStatus | null
  hasSubscription?: boolean
  onSelectPlan?: (tierId: string) => void
}): ReactElement => {
  const currentTierIndex = group.tiers.findIndex((t) => t.id === currentPlanId)
  const nudgeUpgrade = status === 'approaching_limit' || status === 'limit_reached'
  const initialTierIndex =
    currentTierIndex < 0 ? 0 : nudgeUpgrade ? Math.min(currentTierIndex + 1, group.tiers.length - 1) : currentTierIndex

  const [activeTierIndex, setActiveTierIndex] = useState(initialTierIndex)
  useEffect(() => setActiveTierIndex(initialTierIndex), [initialTierIndex])

  const tier = group.tiers[activeTierIndex]
  const hasTiers = group.tiers.length > 1
  const dotClass = status ? STATUS_DOT_CLASS[status] : ''

  const isDefaultPlan = tier.isCurrent
  const isActiveSubscription = tier.id === currentPlanId

  return (
    <div className={css.planCard} data-testid={`billing-plan-card-${group.id}`}>
      <div className={css.cardHeader}>
        {hasTiers ? (
          <div className={css.tierToggle} role="group" aria-label={`${group.tiers[0].name} tier`}>
            {group.tiers.map((t, index) => (
              <button
                key={t.id}
                type="button"
                className={index === activeTierIndex ? css.tierTabActive : css.tierTab}
                aria-pressed={index === activeTierIndex}
                onClick={() => setActiveTierIndex(index)}
              >
                {t.id === currentPlanId && <span className={`${css.currentDot} ${dotClass}`} aria-hidden />}
                {t.name}
              </button>
            ))}
          </div>
        ) : (
          <p className={css.starterTitle}>{tier.name}</p>
        )}

        <p className={css.price}>
          <span className={css.priceAmount}>{formatPrice(tier.priceMonthlyUsd, period)}</span>
          <span className={css.priceUnit}>/mo</span>
          {isActiveSubscription && (
            <span className={`${css.priceUnit} ${css.priceStatus}`}>
              • {status === 'payment_failed' ? 'Renewal failed' : 'Active'}
            </span>
          )}
        </p>
      </div>

      <ul className={css.featureList}>
        {tier.features.map((feature) => (
          <li key={feature} className={css.featureRow}>
            <span className={css.featureCheck}>
              <Check size={12} />
            </span>
            {feature}
          </li>
        ))}
      </ul>

      {isDefaultPlan ? (
        <div className={css.currentPlan}>{tier.cta}</div>
      ) : (
        <button
          type="button"
          className={css.upgradeButton}
          onClick={() => onSelectPlan?.(tier.id)}
          data-testid={`billing-plan-cta-${group.id}`}
        >
          {isActiveSubscription ? 'Manage plan' : hasSubscription ? tier.cta : 'Subscribe now'}
        </button>
      )}
    </div>
  )
}

export default PlanCard
