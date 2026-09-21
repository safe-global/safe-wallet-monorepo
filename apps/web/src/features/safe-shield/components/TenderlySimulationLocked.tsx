import type { ReactElement } from 'react'
import { useCurrentChain } from '@/hooks/useChains'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import { LockedCheckRow } from './LockedCheckRow'

/**
 * The simulation row without Safe Pro and without a Tenderly project of one's own: nothing is called, the row only
 * says how to unlock it. The Pro header above carries the upgrade.
 */
export const TenderlySimulationLocked = (): ReactElement | null => {
  const chain = useCurrentChain()
  if (!chain || !hasFeature(chain, FEATURES.TX_SIMULATION)) return null

  return (
    <LockedCheckRow
      data-testid="tenderly-simulation-locked"
      tooltip="Built-in simulation is part of Safe Pro. To simulate on your own Tenderly project, add its URL and access token in Settings › Environment variables."
    >
      Transaction simulation
    </LockedCheckRow>
  )
}
