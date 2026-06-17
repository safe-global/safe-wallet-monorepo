import { type ReactElement } from 'react'
import { Box, Button, Stack, Typography } from '@mui/material'
import { formatCurrency } from '@safe-global/utils/utils/formatNumber'
import { useBillingData } from '../BillingDataContext'

/**
 * "Get flat pricing" upsell shown in the Starter (no-paid-plan) state. The Upgrade CTA is wired to
 * the purchase flow in PLA-1640; here it surfaces the recent-usage hook so the banner is demoable.
 */
const StarterUpsellBanner = ({ onUpgrade }: { onUpgrade?: () => void }): ReactElement => {
  const { usage } = useBillingData()

  return (
    <Box
      data-testid="billing-upsell-banner"
      sx={{
        p: 3,
        borderRadius: 1,
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: 'border.light',
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ sm: 'center' }}
        justifyContent="space-between"
      >
        <Box>
          <Typography variant="h4" fontWeight={700} mb={0.5}>
            Get flat pricing
          </Typography>
          <Typography color="primary.light">
            In the past {usage.periodDays} days, you moved {formatCurrency(usage.movedUsd, 'USD')} across{' '}
            {usage.transactionCount} transactions
          </Typography>
        </Box>

        <Button variant="contained" onClick={onUpgrade} data-testid="billing-upsell-upgrade">
          Upgrade
        </Button>
      </Stack>
    </Box>
  )
}

export default StarterUpsellBanner
