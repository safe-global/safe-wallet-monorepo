import usePositions from './hooks/usePositions'
import PositionsEmpty from './components/PositionsEmpty'
import usePositionsFiatTotal from './hooks/usePositionsFiatTotal'
import React from 'react'
import PositionsUnavailable from '@views/features/positions/components/PositionsUnavailable'
import TotalAssetValue from '@/components/balances/TotalAssetValue'
import PositionsSkeleton from '@views/features/positions/components/PositionsSkeleton'
import { PortfolioFeature } from '@/features/portfolio'
import { useLoadFeature } from '@/features/__core__'
import { PositionsView } from '@views/features/positions/PositionsView'

export { default as useIsPositionsFeatureEnabled } from './hooks/useIsPositionsFeatureEnabled'

const ENTRY_POINT = 'Positions'

const Positions = () => {
  const positionsFiatTotal = usePositionsFiatTotal()
  const { data: protocols, error, isLoading } = usePositions()
  const portfolio = useLoadFeature(PortfolioFeature)

  if (isLoading) {
    return <PositionsSkeleton />
  }

  if (error || !protocols) return <PositionsUnavailable hasError={!!error} />

  if (protocols.length === 0) {
    return <PositionsEmpty entryPoint={ENTRY_POINT} />
  }

  return (
    <PositionsView
      protocols={protocols}
      positionsFiatTotal={positionsFiatTotal}
      isPortfolioDisabled={!!portfolio.$isDisabled}
      renderTotalAssetValue={(props) => (
        <TotalAssetValue
          fiatTotal={positionsFiatTotal}
          action={<portfolio.PortfolioRefreshHint entryPoint={ENTRY_POINT} />}
          {...props}
        />
      )}
    />
  )
}

export default Positions
