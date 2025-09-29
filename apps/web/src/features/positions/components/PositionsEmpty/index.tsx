import { useRouter } from 'next/router'
import Link from 'next/link'
import { Button, Paper, Typography } from '@mui/material'
import DefiIcon from '@/public/images/balances/defi.svg'
import { AppRoutes } from '@/config/routes'
import Track from '@/components/common/Track'
import { POSITIONS_EVENTS } from '@/services/analytics/events/positions'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { useIsEarnPromoEnabled } from '@/features/earn/hooks/useIsEarnFeatureEnabled'

type PositionsEmptyProps = {
  entryPoint?: string
}

const PositionsEmpty = ({ entryPoint = 'Dashboard' }: PositionsEmptyProps) => {
  const router = useRouter()
  const isEarnFeatureEnabled = useIsEarnPromoEnabled()

  return (
    <Paper elevation={0} sx={{ p: 3, textAlign: 'center' }}>
      <DefiIcon />

      <Typography data-testid="no-tx-text" variant="body1" color="primary.light">
        You have no active DeFi positions yet
      </Typography>

      {isEarnFeatureEnabled && (
        <Track
          {...POSITIONS_EVENTS.EMPTY_POSITIONS_EXPLORE_CLICKED}
          mixpanelParams={{
            [MixpanelEventParams.ENTRY_POINT]: entryPoint,
          }}
        >
          <Link href={{ pathname: AppRoutes.earn, query: { safe: router.query.safe } }} passHref>
            <Button size="small" sx={{ mt: 1 }}>
              Explore Earn
            </Button>
          </Link>
        </Track>
      )}
    </Paper>
  )
}

export default PositionsEmpty
