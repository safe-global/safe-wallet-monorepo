import { useRouter } from 'next/router'
import NextLink from 'next/link'
import DefiIcon from '@/public/images/balances/defi.svg'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { AppRoutes } from '@/config/routes'
import Track from '@/components/common/Track'
import { POSITIONS_EVENTS } from '@/services/analytics/events/positions'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { useIsEarnPromoEnabled } from '@/features/earn'

type PositionsEmptyProps = {
  entryPoint?: string
}

const PositionsEmpty = ({ entryPoint = 'Dashboard' }: PositionsEmptyProps) => {
  const router = useRouter()
  const isEarnFeatureEnabled = useIsEarnPromoEnabled()

  return (
    <div className="rounded-xl border border-border bg-card p-6 text-center">
      <DefiIcon />

      <Typography data-testid="no-tx-text" align="center" className="text-[var(--color-primary-light)]">
        You have no active DeFi positions yet
      </Typography>

      {isEarnFeatureEnabled && (
        <Track
          {...POSITIONS_EVENTS.EMPTY_POSITIONS_EXPLORE_CLICKED}
          mixpanelParams={{
            [MixpanelEventParams.ENTRY_POINT]: entryPoint,
          }}
        >
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            render={<NextLink href={{ pathname: AppRoutes.earn, query: { safe: router.query.safe } }} />}
          >
            Explore Earn
          </Button>
        </Track>
      )}
    </div>
  )
}

export default PositionsEmpty
