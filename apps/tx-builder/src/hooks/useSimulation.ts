import { useCallback, useState, useMemo } from 'react'
import { TenderlySimulation } from '../lib/simulation/types'
import {
  getSimulationPayload,
  getSimulation,
  getSimulationLink,
  isSimulationSupported,
} from '../lib/simulation/simulation'
import { useNetwork } from '../store/networkContext'
import { useTransactions } from '../store'
import { FETCH_STATUS } from '../utils'
import useAsync from './useAsync'

type UseSimulationReturn =
  | {
      simulationRequestStatus: FETCH_STATUS.NOT_ASKED | FETCH_STATUS.ERROR | FETCH_STATUS.LOADING
      simulation: undefined
      simulateTransaction: () => void
      simulationLink: string
      simulationSupported: boolean
    }
  | {
      simulationRequestStatus: FETCH_STATUS.SUCCESS
      simulation: TenderlySimulation
      simulateTransaction: () => void
      simulationLink: string
      simulationSupported: boolean
    }

const useSimulation = (): UseSimulationReturn => {
  const { transactions } = useTransactions()
  const [simulation, setSimulation] = useState<TenderlySimulation | undefined>()
  const [simulationRequestStatus, setSimulationRequestStatus] = useState<FETCH_STATUS>(FETCH_STATUS.NOT_ASKED)
  const simulationLink = useMemo(() => getSimulationLink(simulation?.simulation.id || ''), [simulation])
  const { safe, provider } = useNetwork()
  const [simulationSupported = false] = useAsync(() => isSimulationSupported(safe.chainId.toString()), [safe.chainId])

  const simulateTransaction = useCallback(async () => {
    if (!provider) return

    setSimulationRequestStatus(FETCH_STATUS.LOADING)
    try {
      const safeNonce = await provider.getStorage(safe.safeAddress, `0x${'3'.padStart(64, '0')}`)
      const block = await provider.getBlock('latest')
      const blockGasLimit = block?.gasLimit?.toString() || '30000000'

      const simulationPayload = getSimulationPayload({
        chainId: safe.chainId.toString(),
        safeAddress: safe.safeAddress,
        executionOwner: safe.owners[0],
        safeNonce,
        transactions: transactions.map((t) => t.raw),
        gasLimit: parseInt(blockGasLimit),
      })

      const simulationResponse = await getSimulation(simulationPayload)
      setSimulation(simulationResponse)
      setSimulationRequestStatus(FETCH_STATUS.SUCCESS)
    } catch (error) {
      console.error(error)
      setSimulationRequestStatus(FETCH_STATUS.ERROR)
    }
  }, [safe, transactions, provider])

  return {
    simulateTransaction,
    simulationRequestStatus,
    simulation,
    simulationLink,
    simulationSupported,
  } as UseSimulationReturn
}

export { useSimulation }
