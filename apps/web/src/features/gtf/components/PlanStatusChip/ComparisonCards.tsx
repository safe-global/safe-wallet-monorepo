import { type ReactElement } from 'react'
import { ArrowUpRight, Check } from 'lucide-react'
import type { PlanComparison } from './modalContent'
import type { PlanTier } from './types'
import css from './PlanStatusModal.module.css'

const COMPARE_URL = 'https://safe.global/pricing'

const Card = ({ tier, isActive }: { tier: PlanTier; isActive: boolean }): ReactElement => (
  <div className={`${css.planCard} ${isActive ? '' : css.planCardHighlight}`} data-testid={`plan-card-${tier.id}`}>
    <div className={css.cardHeader}>
      <p className={css.planName}>
        {tier.name}
        {isActive && <span className={css.planActiveTag}> · Active</span>}
      </p>
      <p className={css.planPrice}>
        <span className={css.planPriceAmount}>${tier.priceMonthlyUsd.toLocaleString('en-US')}</span>
        <span className={css.planPriceUnit}>/mo</span>
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
  </div>
)

const ComparisonCards = ({ comparison }: { comparison: PlanComparison }): ReactElement => (
  <div className={css.plans} data-testid="plan-comparison">
    <div className={css.plansHeader}>
      <p className={css.plansTitle}>Plans</p>
      <a href={COMPARE_URL} target="_blank" rel="noreferrer" className={css.compareLink}>
        Compare all features
        <ArrowUpRight size={16} />
      </a>
    </div>
    <div className={css.plansRow}>
      {comparison.tiers.map((tier) => (
        <Card key={tier.id} tier={tier} isActive={tier.id === comparison.activeTierId} />
      ))}
    </div>
  </div>
)

export default ComparisonCards
