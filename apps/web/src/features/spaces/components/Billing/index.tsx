import { type ReactElement } from 'react'
import { Box, Stack, Typography } from '@mui/material'
import { useBillingData } from './BillingDataContext'
import SubscriptionSection from './sections/SubscriptionSection'
import PlansSection from './sections/PlansSection'
import StarterUpsellBanner from './StarterUpsellBanner'

const Billing = (): ReactElement => {
  const { subscription } = useBillingData()

  return (
    <Box data-testid="billing-page">
      <Typography variant="h1" mb={3}>
        Billing
      </Typography>

      <Stack spacing={3}>
        {subscription ? <SubscriptionSection /> : <StarterUpsellBanner />}
        <PlansSection />
      </Stack>
    </Box>
  )
}

export default Billing
