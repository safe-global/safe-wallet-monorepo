import { type ReactElement } from 'react'
import { Box, Stack, Typography } from '@mui/material'
import { useBillingPage } from '@/features/spaces'
import SubscriptionSection from './sections/SubscriptionSection'
import PlansSection from './sections/PlansSection'
import StarterUpsellBanner from './StarterUpsellBanner'
import CheckoutReturnBanner from './CheckoutReturnBanner'

const PLANS_ANCHOR = 'billing-plans'

const Billing = (): ReactElement => {
  const { state, subscription, isReturning, checkoutStatus } = useBillingPage()

  const scrollToPlans = () => {
    document.getElementById(PLANS_ANCHOR)?.scrollIntoView({ behavior: 'smooth' })
  }

  // A paid subscription (active / payment_failed / canceled) shows the header
  // card; otherwise the Starter upsell. During activation we keep the upsell out
  // and let the return banner communicate progress.
  const hasSubscriptionCard = subscription != null && state !== 'activating'

  return (
    <Box data-testid="billing-page">
      <Typography variant="h1" mb={3}>
        Billing
      </Typography>

      <Stack spacing={3}>
        {isReturning && <CheckoutReturnBanner status={checkoutStatus} />}

        {hasSubscriptionCard ? (
          <SubscriptionSection subscription={subscription} state={state} />
        ) : state === 'none' ? (
          <StarterUpsellBanner onUpgrade={scrollToPlans} />
        ) : null}

        <div id={PLANS_ANCHOR}>
          <PlansSection />
        </div>
      </Stack>
    </Box>
  )
}

export default Billing
