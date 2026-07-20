import { type ReactElement } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { Skeleton } from '@mui/material'
import { usePaymentLinks } from '@/features/spaces'
import { useCheckout } from '@/features/spaces'
import { useBillingSubscription } from '@/features/spaces'
import PlanCard from './PlanCard'
import css from './styles.module.css'

const PlansSection = (): ReactElement | null => {
  const { paymentLinks, isLoading } = usePaymentLinks()
  const { subscription } = useBillingSubscription()
  const { startCheckout, isRedirecting } = useCheckout()

  const currentPlanId = subscription?.plan.id

  if (!isLoading && paymentLinks.length === 0) return null

  return (
    <section className={css.section} data-testid="billing-plans-section">
      <div className={css.header}>
        <h2 className={css.title}>Plans</h2>
        <div className={css.headerRow}>
          <a className={css.compareLink} href="https://safe.global/pricing" target="_blank" rel="noreferrer">
            Compare all features
            <ArrowUpRight size={16} />
          </a>
        </div>
      </div>

      <div className={css.cardsRow}>
        {isLoading
          ? Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} variant="rounded" height={320} className={css.card} />
            ))
          : paymentLinks.map((paymentLink) => (
              <PlanCard
                key={paymentLink.id}
                paymentLink={paymentLink}
                isCurrent={currentPlanId === paymentLink.id}
                isBusy={isRedirecting}
                onSelect={startCheckout}
              />
            ))}
      </div>
    </section>
  )
}

export default PlansSection
