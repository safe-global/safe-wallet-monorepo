import { type ReactElement } from 'react'
import { Box, Button, Stack, Typography } from '@mui/material'
import { TicketPercent } from 'lucide-react'
import { formatCurrency } from '@safe-global/utils/utils/formatNumber'
import { useBillingData } from '../BillingDataContext'
import css from './styles.module.css'

const StarterUpsellBanner = ({ onUpgrade }: { onUpgrade?: () => void }): ReactElement => {
  const { usage } = useBillingData()

  return (
    <Box className={css.banner} data-testid="billing-upsell-banner">
      <Box aria-hidden className={css.glow}>
        <Box className={css.glowBlob} />
      </Box>

      <Box className={css.iconBadge}>
        <TicketPercent size={24} />
      </Box>

      <Box className={css.content}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1.5}>
          <Typography variant="h4" fontWeight={700}>
            Get flat pricing
          </Typography>
          <Button
            variant="contained"
            onClick={onUpgrade}
            data-testid="billing-upsell-upgrade"
            className={css.upgradeButton}
          >
            Upgrade to Pro
          </Button>
        </Stack>

        <Typography mt={0.5}>
          In the past {usage.periodDays} days, you moved <strong>{formatCurrency(usage.movedUsd, 'USD')}</strong> across{' '}
          <strong>{usage.transactionCount}</strong> transactions.
        </Typography>
      </Box>
    </Box>
  )
}

export default StarterUpsellBanner
