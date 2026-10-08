import usePositionsFiatTotal from '../../hooks/usePositionsFiatTotal'
import React, { useMemo, type ReactElement } from 'react'
import { AppRoutes } from '@/config/routes'
import usePositions from '../../hooks/usePositions'
import Track from '@/components/common/Track'
import { trackEvent } from '@/services/analytics'
import { POSITIONS_EVENTS, POSITIONS_LABELS } from '@/services/analytics/events/positions'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useHasFeature } from '@/hooks/useChains'
import { useSafeLinkQuery } from '@/hooks/useSafeLinkQuery'
import type { Protocol } from '@safe-global/store/gateway/AUTO_GENERATED/positions'
import { PositionsWidgetView } from '@views/features/positions/components/PositionsWidget/PositionsWidgetView'

const MAX_PROTOCOLS = 4

const PositionsWidget = () => {
  const safeLinkQuery = useSafeLinkQuery()
  const { data, error, isLoading } = usePositions()
  const positionsFiatTotal = usePositionsFiatTotal()
  const isPortfolioEndpointEnabled = useHasFeature(FEATURES.PORTFOLIO_ENDPOINT) ?? false

  const viewAllUrl = useMemo(
    () => ({
      pathname: AppRoutes.balances.positions,
      query: safeLinkQuery,
    }),
    [safeLinkQuery],
  )

  const viewAllWrapper = (children: ReactElement) => (
    <Track
      {...POSITIONS_EVENTS.POSITIONS_VIEW_ALL_CLICKED}
      mixpanelParams={{
        [MixpanelEventParams.TOTAL_VALUE_OF_PORTFOLIO]: positionsFiatTotal || 0,
        [MixpanelEventParams.ENTRY_POINT]: 'Dashboard',
      }}
    >
      {children}
    </Track>
  )

  const handleProtocolExpand = (protocol: Protocol) => {
    trackEvent(POSITIONS_EVENTS.POSITION_EXPANDED, {
      [MixpanelEventParams.PROTOCOL_NAME]: protocol.protocol,
      [MixpanelEventParams.LOCATION]: POSITIONS_LABELS.dashboard,
      [MixpanelEventParams.AMOUNT_USD]: Number(protocol.fiatTotal) || 0,
    })
  }

  const protocols = data?.slice(0, MAX_PROTOCOLS) ?? []

  if (!isLoading && (error || !data || protocols.length === 0)) return null

  return (
    <PositionsWidgetView
      isLoading={isLoading}
      protocols={protocols}
      positionsFiatTotal={positionsFiatTotal}
      isPortfolioEndpointEnabled={isPortfolioEndpointEnabled}
      viewAllUrl={viewAllUrl}
      viewAllWrapper={viewAllWrapper}
      onProtocolExpand={handleProtocolExpand}
    />
  )
}

export default PositionsWidget
