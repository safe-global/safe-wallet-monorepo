import { type ReactElement } from 'react'
import { Box, Typography } from '@mui/material'
import { useBillingData } from '../BillingDataContext'

/** Subscription + usage slot. Renders nothing in the Starter state; the shell shows only the heading + current plan. */
const SubscriptionSection = (): ReactElement | null => {
  const { subscription } = useBillingData()

  if (!subscription) return null

  return (
    <Box data-testid="billing-subscription-section">
      <Typography variant="h4" fontWeight={700} mb={1}>
        Subscription
      </Typography>
      <Typography color="primary.light">Current plan: {subscription.planName}</Typography>
    </Box>
  )
}

export default SubscriptionSection
