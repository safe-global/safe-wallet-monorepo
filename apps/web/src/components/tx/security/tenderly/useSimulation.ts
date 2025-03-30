import { useCallback, useMemo, useState } from 'react'

import { getSimulation, getSimulationLink } from '@/components/tx/security/tenderly/utils'
import { FETCH_STATUS, type TenderlySimulation } from '@/components/tx/security/tenderly/types'
import { getSimulationPayload, type SimulationTxParams } from '@/components/tx/security/tenderly/utils'
import { useAppSelector } from '@/store'
import { selectTenderly } from '@/store/settingsSlice'
import { asError } from '@safe-global/utils/services/exceptions/utils'

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

export const useSimulation = (): UseSimulationReturn => {
  const [simulation, setSimulation] = useState<TenderlySimulation | undefined>()
  const [simulationRequestStatus, setSimulationRequestStatus] = useState<FETCH_STATUS>(FETCH_STATUS.NOT_ASKED)
  const [requestError, setRequestError] = useState<string | undefined>(undefined)
  const tenderly = useAppSelector(selectTenderly)

  const simulationLink = useMemo(() => getSimulationLink(simulation?.simulation.id || ''), [simulation])

  const resetSimulation = useCallback(() => {
    setSimulationRequestStatus(FETCH_STATUS.NOT_ASKED)
    setRequestError(undefined)
    setSimulation(undefined)
  }, [])

  const simulateTransaction = useCallback(
    async (params: SimulationTxParams) => {
      setSimulationRequestStatus(FETCH_STATUS.LOADING)
      setRequestError(undefined)

      try {
        const simulationPayload = await getSimulationPayload(params)

        const data = await getSimulation(simulationPayload, tenderly)

        setSimulation(data)
        setSimulationRequestStatus(FETCH_STATUS.SUCCESS)
      } catch (error) {
        console.error(error)

        setRequestError(asError(error).message)
        setSimulationRequestStatus(FETCH_STATUS.ERROR)
      }
    },
    [tenderly],
  )

  return {
    simulateTransaction,
    // This is only used by the provider
    _simulationRequestStatus: simulationRequestStatus,
    simulation,
    simulationLink,
    requestError,
    resetSimulation,
  } as UseSimulationReturn
}
