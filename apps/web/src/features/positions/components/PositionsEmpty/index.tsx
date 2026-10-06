import NextLink from 'next/link'
import DefiIcon from '@/public/images/balances/defi.svg'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { AppRoutes } from '@/config/routes'
import Track from '@/components/common/Track'
import { POSITIONS_EVENTS } from '@/services/analytics/events/positions'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { useIsEarnPromoEnabled } from '@/features/earn'
import { useSafeLinkQuery } from '@/hooks/useSafeLinkQuery'

type PositionsEmptyProps = {
  entryPoint?: string
}

const PositionsEmpty = ({ entryPoint = 'Dashboard' }: PositionsEmptyProps) => {
  const safeLinkQuery = useSafeLinkQuery()
  const isEarnFeatureEnabled = useIsEarnPromoEnabled()

  return (
    <div className="rounded-xl bg-card p-6 text-center">
      <DefiIcon className="mx-auto" />

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
            render={<NextLink href={{ pathname: AppRoutes.earn, query: safeLinkQuery }} />}
          >
            Explore Earn
          </Button>
        </Track>
      )}
    </div>
  )
}

export default PositionsEmpty
