import type { ReactElement } from 'react'
import { AppRoutes } from '@/config/routes'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useSafeLinkQuery } from '@/hooks/useSafeLinkQuery'
import { TenderlySimulationLockedView } from '@views/features/safe-shield/components/TenderlySimulationLockedView'

/** Without Pro or an own Tenderly project nothing is called; "Set" leads to settings to bring one's own project. */
export const TenderlySimulationLocked = (): ReactElement | null => {
  const hasSimulation = useHasFeature(FEATURES.TX_SIMULATION) === true
  const safeLinkQuery = useSafeLinkQuery()
  if (!hasSimulation) return null

  return (
    <TenderlySimulationLockedView
      settingsHref={{
        pathname: AppRoutes.settings.environmentVariables,
        query: safeLinkQuery,
      }}
    />
  )
}
