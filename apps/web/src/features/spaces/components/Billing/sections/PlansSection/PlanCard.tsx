import { type ReactElement } from 'react'
import { Check } from 'lucide-react'
import type { PaymentLink } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import { getPlanFeatures, getPlanName, getPlanPrice } from '@/features/spaces'
import css from './styles.module.css'

const PlanCard = ({
  paymentLink,
  isCurrent = false,
  isBusy = false,
  onSelect,
}: {
  paymentLink: PaymentLink
  /** Whether this plan is the space's active subscription. */
  isCurrent?: boolean
  /** Disables the CTA while a checkout redirect is in flight. */
  isBusy?: boolean
  onSelect?: (paymentLinkId: string) => void
}): ReactElement => {
  const name = getPlanName(paymentLink.metadata)
  const price = getPlanPrice(paymentLink)
  const features = getPlanFeatures(paymentLink.metadata)

  return (
    <div className={css.planCard} data-testid={`billing-plan-card-${paymentLink.id}`}>
      <div className={css.cardHeader}>
        <p className={css.starterTitle}>{name}</p>

        <p className={css.price}>
          <span className={css.priceAmount}>
            {price ? `${price.symbol}${price.amount.toLocaleString('en-US')}` : '—'}
          </span>
          <span className={css.priceUnit}>{price ? price.cycle : '/mo'}</span>
          {isCurrent && <span className={`${css.priceUnit} ${css.priceStatus}`}>• Active</span>}
        </p>
      </div>

      <ul className={css.featureList}>
        {features.map((feature) => (
          <li key={feature} className={css.featureRow}>
            <span className={css.featureCheck}>
              <Check size={12} />
            </span>
            {feature}
          </li>
        ))}
      </ul>

      {isCurrent ? (
        <div className={css.currentPlan}>Current plan</div>
      ) : (
        <button
          type="button"
          className={css.upgradeButton}
          onClick={() => onSelect?.(paymentLink.id)}
          disabled={isBusy}
          data-testid={`billing-plan-cta-${paymentLink.id}`}
        >
          {isBusy ? 'Redirecting…' : 'Subscribe now'}
        </button>
      )}
    </div>
  )
}

export default PlanCard
