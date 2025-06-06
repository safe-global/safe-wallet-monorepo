import { createContext, type ReactElement } from 'react'

import { useSimulation } from '@/components/tx/security/tenderly/useSimulation'
import { FETCH_STATUS } from '@safe-global/utils/components/tx/security/tenderly/types'
import type { UseSimulationReturn } from '@safe-global/utils/components/tx/security/tenderly/useSimulation'
import { getSimulationStatus } from '@safe-global/utils/components/tx/security/tenderly/utils'

type SimulationStatus = {
  isLoading: boolean
  isFinished: boolean
  isSuccess: boolean
  isCallTraceError: boolean
  isError: boolean
}

const initialSimulation: UseSimulationReturn = {
  simulateTransaction: () => {},
  simulation: undefined,
  _simulationRequestStatus: FETCH_STATUS.NOT_ASKED,
  simulationLink: '',
  requestError: undefined,
  resetSimulation: () => {},
}

const initialStatus: SimulationStatus = {
  isLoading: false,
  isFinished: false,
  isSuccess: false,
  isCallTraceError: false,
  isError: false,
}

export const TxInfoContext = createContext<{
  simulation: UseSimulationReturn
  status: SimulationStatus
  nestedTx: {
    simulation: UseSimulationReturn
    status: SimulationStatus
  }
}>({
  simulation: initialSimulation,
  status: initialStatus,
  nestedTx: {
    simulation: initialSimulation,
    status: initialStatus,
  },
})

export const TxInfoProvider = ({ children }: { children: ReactElement }) => {
  const simulation = useSimulation()
  const nestedSimulation = useSimulation()

  const status = getSimulationStatus(simulation)

  const nestedTx = {
    simulation: nestedSimulation,
    status: getSimulationStatus(nestedSimulation),
  }

  return <TxInfoContext.Provider value={{ simulation, status, nestedTx }}>{children}</TxInfoContext.Provider>
}
