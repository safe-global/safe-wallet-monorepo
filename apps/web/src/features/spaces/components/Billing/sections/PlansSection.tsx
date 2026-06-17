import { type ReactElement } from 'react'
import { Box, Typography } from '@mui/material'
import { useBillingData } from '../BillingDataContext'

/** Plan cards + purchase-flow slot; the shell renders only the heading. */
const PlansSection = (): ReactElement => {
  const { plans } = useBillingData()

  return (
    <Box data-testid="billing-plans-section">
      <Typography variant="h4" fontWeight={700} mb={1}>
        Plans
      </Typography>
      <Typography color="primary.light">{plans.length} plans available</Typography>
    </Box>
  )
}

export default PlansSection
