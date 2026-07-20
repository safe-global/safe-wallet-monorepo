import { type ReactElement } from 'react'
import { Box, Button, Typography } from '@mui/material'
import { TicketPercent } from 'lucide-react'
import css from './styles.module.css'

const StarterUpsellBanner = ({ onUpgrade }: { onUpgrade?: () => void }): ReactElement => {
  return (
    <Box className={css.banner} data-testid="billing-upsell-banner">
      <Box aria-hidden className={css.glow}>
        <Box className={css.glowBlob} />
      </Box>

      <Box className={css.iconBadge}>
        <TicketPercent size={24} />
      </Box>

      <Box className={css.content}>
        <Box className={css.titleRow}>
          <Typography variant="h4" component="h2" fontWeight={700}>
            Get flat pricing
          </Typography>
          <Button
            variant="contained"
            onClick={onUpgrade}
            data-testid="billing-upsell-upgrade"
            className={css.upgradeButton}
          >
            Explore plans
          </Button>
        </Box>

        <Typography className={css.summary}>
          Cover more Safe Accounts and unlock fee-free volume with a paid plan.
        </Typography>
      </Box>
    </Box>
  )
}

export default StarterUpsellBanner
