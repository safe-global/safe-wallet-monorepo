import { useCallback, useMemo, useState } from 'react'

import { getSimulation, getSimulationLink } from '@/components/tx/security/tenderly/utils'
import { FETCH_STATUS, type RequiredTenderlySimulation } from '@/components/tx/security/tenderly/types'
import { getSimulationPayload, type SimulationTxParams } from '@/components/tx/security/tenderly/utils'
import { useAppSelector } from '@/store'
import { selectTenderly } from '@/store/settingsSlice'
import { asError } from '@/services/exceptions/utils'
import useIsSafenetEnabled from '@/features/safenet/hooks/useIsSafenetEnabled'
import { useLazySimulateSafenetTransactionQuery } from '@/store/safenet'
import { calculateSafeTransactionHash } from '@safe-global/protocol-kit/dist/src/utils'
import { LATEST_SAFE_VERSION } from '@/config/constants'

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
      simulation: RequiredTenderlySimulation
      simulateTransaction: (params: SimulationTxParams) => void
      simulationLink: string
      requestError?: string
      resetSimulation: () => void
    }

export const useSimulation = (): UseSimulationReturn => {
  const [simulation, setSimulation] = useState<RequiredTenderlySimulation | undefined>()
  const [simulationRequestStatus, setSimulationRequestStatus] = useState<FETCH_STATUS>(FETCH_STATUS.NOT_ASKED)
  const [requestError, setRequestError] = useState<string | undefined>(undefined)
  const isSafenetEnabled = useIsSafenetEnabled()
  const [simulateSafenet] = useLazySimulateSafenetTransactionQuery()

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

      let data: RequiredTenderlySimulation | undefined

      try {
        if (!isSafenetEnabled) {
          const simulationPayload = await getSimulationPayload(params)
          data = await getSimulation(simulationPayload, tenderly)
        } else {
          if (Array.isArray(params.transactions)) {
            throw new Error('Batch execution is not possible with Safenet Accounts')
          }
          const safeTxHash = calculateSafeTransactionHash(
            params.safe.address.value,
            params.transactions.data,
            params.safe.version ?? LATEST_SAFE_VERSION,
            BigInt(params.safe.chainId),
          )

          const { data: safenetSimulation } = await simulateSafenet({
            chainId: params.safe.chainId,
            tx: {
              safe: params.safe.address.value,
              safeTxHash,
            },
          })

          if (safenetSimulation) {
            data = safenetSimulation
          }
        }

        setSimulation(data)
        setSimulationRequestStatus(FETCH_STATUS.SUCCESS)
      } catch (error) {
        console.error(error)

        setRequestError(asError(error).message)
        setSimulationRequestStatus(FETCH_STATUS.ERROR)
      }
    },
    [isSafenetEnabled, simulateSafenet, tenderly],
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
