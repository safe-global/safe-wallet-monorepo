import { FETCH_STATUS, type TenderlySimulation } from '@safe-global/utils/components/tx/security/tenderly/types'
import type { SimulationTxParams } from '@safe-global/utils/components/tx/security/tenderly/utils'

export type UseSimulationReturn =
  | {
      _simulationRequestStatus: FETCH_STATUS.NOT_ASKED | FETCH_STATUS.ERROR | FETCH_STATUS.LOADING
      simulation: undefined
      simulateTransaction: (params: SimulationTxParams) => void
      simulationLink: string
      requestError?: string
      resetSimulation: () => void
    }
  | {
      _simulationRequestStatus: FETCH_STATUS.SUCCESS
      simulation: TenderlySimulation
      simulateTransaction: (params: SimulationTxParams) => void
      simulationLink: string
      requestError?: string
      resetSimulation: () => void
    }