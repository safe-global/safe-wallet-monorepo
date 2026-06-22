import { type ReactElement, useState } from 'react'
import { Check } from 'lucide-react'
import type { BillingPeriod, PlanGroup } from '../../types'
import css from './styles.module.css'

const YEARLY_DISCOUNT = 0.9

const formatPrice = (priceMonthlyUsd: number, period: BillingPeriod): string => {
  const price = period === 'yearly' ? Math.round(priceMonthlyUsd * YEARLY_DISCOUNT) : priceMonthlyUsd
  return `$${price.toLocaleString('en-US')}`
}

const PlanCard = ({
  group,
  period,
  onSelectPlan,
}: {
  group: PlanGroup
  period: BillingPeriod
  onSelectPlan?: (tierId: string) => void
}): ReactElement => {
  const [activeTierIndex, setActiveTierIndex] = useState(0)
  const tier = group.tiers[activeTierIndex]
  const hasTiers = group.tiers.length > 1

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

      {tier.isCurrent ? (
        <div className={css.currentPlan}>{tier.cta}</div>
      ) : (
        <button
          type="button"
          className={css.upgradeButton}
          onClick={() => onSelectPlan?.(tier.id)}
          data-testid={`billing-plan-cta-${group.id}`}
        >
          {tier.cta}
        </button>
      )}
    </div>
  )
}

export default PlanCard
