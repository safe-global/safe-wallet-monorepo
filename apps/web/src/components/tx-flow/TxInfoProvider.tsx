import { createContext, type ReactElement } from 'react'

import { useSimulation, type UseSimulationReturn } from '@/components/tx/security/tenderly/useSimulation'
import { FETCH_STATUS, type TenderlySimulation } from '@safe-global/utils/components/tx/security/tenderly/types'

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

export const TxInfoContext = createContext<{
  simulation: UseSimulationReturn
  status: SimulationStatus
}>({
  simulation: {
    simulateTransaction: () => {},
    simulation: undefined,
    _simulationRequestStatus: FETCH_STATUS.NOT_ASKED,
    simulationLink: '',
    requestError: undefined,
    resetSimulation: () => {},
  },
  status: {
    isLoading: false,
    isFinished: false,
    isSuccess: false,
    isCallTraceError: false,
    isError: false,
  },
})

export const TxInfoProvider = ({ children }: { children: ReactElement }) => {
  const simulation = useSimulation()

  const isLoading = simulation._simulationRequestStatus === FETCH_STATUS.LOADING

  const isFinished =
    simulation._simulationRequestStatus === FETCH_STATUS.SUCCESS ||
    simulation._simulationRequestStatus === FETCH_STATUS.ERROR

  const isSuccess = simulation.simulation?.simulation.status || false

  // Safe can emit failure event even though Tenderly simulation succeeds
  const isCallTraceError = isSuccess && getCallTraceErrors(simulation.simulation).length > 0
  const isError = simulation._simulationRequestStatus === FETCH_STATUS.ERROR

  const status = {
    isLoading,
    isFinished,
    isSuccess,
    isCallTraceError,
    isError,
  }

  return <TxInfoContext.Provider value={{ simulation, status }}>{children}</TxInfoContext.Provider>
}
