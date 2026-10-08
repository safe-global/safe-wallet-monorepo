import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { useIsEarnPromoEnabled } from '@/features/earn'
import { useSafeLinkQuery } from '@/hooks/useSafeLinkQuery'
import { PositionsEmptyView } from '@views/features/positions/components/PositionsEmpty/PositionsEmptyView'

type PositionsEmptyProps = {
  entryPoint?: string
}

const PositionsEmpty = ({ entryPoint = 'Dashboard' }: PositionsEmptyProps) => {
  const safeLinkQuery = useSafeLinkQuery()
  const isEarnFeatureEnabled = useIsEarnPromoEnabled()

  return (
    <PositionsEmptyView
      showExploreEarn={!!isEarnFeatureEnabled}
      safeLinkQuery={safeLinkQuery}
      mixpanelParams={{
        [MixpanelEventParams.ENTRY_POINT]: entryPoint,
      }}
    />
  )
}

export default PositionsEmpty
