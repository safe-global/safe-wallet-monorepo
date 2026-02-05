import { useCallback, useState } from 'react'
import { getSimulationPayload } from '@/src/features/TransactionChecks/tenderly/utils'
import { FETCH_STATUS, type TenderlySimulation } from '@safe-global/utils/components/tx/security/tenderly/types'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { type UseSimulationReturn } from '@safe-global/utils/components/tx/security/tenderly/useSimulation'
import {
  getSimulation,
  getSimulationLink,
  type SimulationTxParams,
} from '@safe-global/utils/components/tx/security/tenderly/utils'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { selectTenderly } from '@/src/store/settingsSlice'
import Logger from '@/src/utils/logger'
import { setTxSimulation } from '@/src/store/txSimulationSlice'
import { selectCachedSimulation } from '@/src/store/txSimulationSlice'

export const useSimulation = (txId?: string): UseSimulationReturn => {
  const dispatch = useAppDispatch()
  const [simulation, setSimulation] = useState<TenderlySimulation | undefined>()
  const tenderly = useAppSelector(selectTenderly)
  const cachedSimulation = useAppSelector(selectCachedSimulation(txId))

  const resetSimulation = useCallback(() => {
    dispatch(setTxSimulation({ txId, status: FETCH_STATUS.NOT_ASKED }))
    setSimulation(undefined)
  }, [dispatch, txId])

  const simulateTransaction = useCallback(
    async (params: SimulationTxParams) => {
      dispatch(setTxSimulation({ txId, status: FETCH_STATUS.LOADING }))

      try {
        const simulationPayload = await getSimulationPayload(params)

        const data = await getSimulation(simulationPayload, tenderly)
        const link = getSimulationLink(data.simulation.id, tenderly)

        setSimulation(data)

        dispatch(
          setTxSimulation({
            txId,
            link,
            status: FETCH_STATUS.SUCCESS,
            callTrace: data.transaction.call_trace,
            dataStatus: data.simulation.status,
          }),
        )
      } catch (error) {
        Logger.error(asError(error).message)

        dispatch(
          setTxSimulation({
            txId,
            error: asError(error).message,
            status: FETCH_STATUS.ERROR,
          }),
        )
      }
    },
    [tenderly],
  )

  return {
    simulationLink: cachedSimulation?.link,
    simulateTransaction,
    _simulationRequestStatus: cachedSimulation?.status,
    simulationData: simulation,
    requestError: cachedSimulation?.error,
    resetSimulation,
  } as UseSimulationReturn
}
