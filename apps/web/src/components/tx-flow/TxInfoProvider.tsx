import { createContext, type ReactElement } from 'react'

import { useSimulation } from '@/components/tx/security/tenderly/useSimulation'
import { FETCH_STATUS, type TenderlySimulation } from '@safe-global/utils/components/tx/security/tenderly/types'
import type { UseSimulationReturn } from '@safe-global/utils/components/tx/security/tenderly/useSimulation'

const getCallTraceErrors = (simulation?: TenderlySimulation) => {
  if (!simulation || !simulation.simulation.status) {
    return []
  }

  return simulation.transaction.call_trace.filter((call) => call.error)
}

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

const getSimulationStatus = (simulation: UseSimulationReturn): SimulationStatus => {
  const isLoading = simulation._simulationRequestStatus === FETCH_STATUS.LOADING

  const isFinished =
    simulation._simulationRequestStatus === FETCH_STATUS.SUCCESS ||
    simulation._simulationRequestStatus === FETCH_STATUS.ERROR

  const isSuccess = simulation.simulation?.simulation.status || false

  // Safe can emit failure event even though Tenderly simulation succeeds
  const isCallTraceError = isSuccess && getCallTraceErrors(simulation.simulation).length > 0
  const isError = simulation._simulationRequestStatus === FETCH_STATUS.ERROR

  return {
    isLoading,
    isFinished,
    isSuccess,
    isCallTraceError,
    isError,
  }
}

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
