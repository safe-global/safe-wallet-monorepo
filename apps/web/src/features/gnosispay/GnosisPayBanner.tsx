import { Alert, Box, SvgIcon, Typography } from '@mui/material'
import GnosisPayIcon from '@/public/images/common/gnosis-pay.svg'
import { useIsGnosisPaySafe } from './hooks/useIsGnosisPaySafe'

/**
 * Renders a small read-only banner whenever the current Safe is a Gnosis Pay
 * safe. Visible to anyone, regardless of whether they're the wallet enabled
 * on the Delay modifier — the actual write actions are gated separately.
 */
export const GnosisPayBanner = () => {
  const [isGnosisPaySafe] = useIsGnosisPaySafe()

  if (!isGnosisPaySafe) return null

  return (
    <Alert severity="info" icon={false} sx={{ mb: 2 }}>
      <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
        <SvgIcon component={GnosisPayIcon} inheritViewBox sx={{ width: '140px', height: '16px', flexShrink: 0 }} />
        <Typography variant="body2" component="span">
          This is an activated Gnosis Pay Safe. Transactions are queued through a Delay modifier with a 3-minute
          cooldown before they can be executed.
        </Typography>
      </Box>
    </Alert>
  )
}

export default GnosisPayBanner
