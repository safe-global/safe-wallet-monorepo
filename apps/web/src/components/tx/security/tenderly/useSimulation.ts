import { useCallback, useMemo, useState } from 'react'

import { getSimulationPayload } from '@/components/tx/security/tenderly/utils'
import { FETCH_STATUS, type TenderlySimulation } from '@safe-global/utils/components/tx/security/tenderly/types'
import { useAppSelector } from '@/store'
import { selectTenderly } from '@/store/settingsSlice'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { type UseSimulationReturn } from '@safe-global/utils/components/tx/security/tenderly/useSimulation'
import {
  getSimulation,
  getSimulationLink,
  type SimulationTxParams,
} from '@safe-global/utils/components/tx/security/tenderly/utils'

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
