import NextLink from 'next/link'
import type { SafeLinkQuery } from '@/hooks/useSafeLinkQuery'
import DefiIcon from '@/public/images/balances/defi.svg'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { AppRoutes } from '@/config/routes'
import Track from '@/components/common/Track'
import { POSITIONS_EVENTS } from '@/services/analytics/events/positions'

export type PositionsEmptyViewProps = {
  showExploreEarn: boolean
  safeLinkQuery: SafeLinkQuery
  mixpanelParams: Record<string, string>
}

export const PositionsEmptyView = ({ showExploreEarn, safeLinkQuery, mixpanelParams }: PositionsEmptyViewProps) => {
  return (
    <div className="rounded-xl bg-card p-6 text-center">
      <DefiIcon className="mx-auto" />

      <Typography data-testid="no-tx-text" align="center" className="text-[var(--color-primary-light)]">
        You have no active DeFi positions yet
      </Typography>

      {showExploreEarn && (
        <Track {...POSITIONS_EVENTS.EMPTY_POSITIONS_EXPLORE_CLICKED} mixpanelParams={mixpanelParams}>
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
