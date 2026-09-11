import { FETCH_STATUS, type NestedTxStatus } from '@safe-global/utils/components/tx/security/tenderly/types'
import type { UseSimulationReturn } from '@safe-global/utils/components/tx/security/tenderly/useSimulation'
import { getSimulationOutcome, type SimulationStatus } from '@safe-global/utils/components/tx/security/tenderly/utils'
import { _getSimulationIcon, _getSimulationStatusText, _isSimulationSuccessful } from './index'

const finishedStatus = (overrides: Partial<SimulationStatus> = {}): SimulationStatus => ({
  isLoading: false,
  isFinished: true,
  isSuccess: false,
  isCallTraceError: false,
  isError: false,
  ...overrides,
})

const idleSimulation: UseSimulationReturn = {
  simulateTransaction: () => {},
  simulationData: undefined,
  _simulationRequestStatus: FETCH_STATUS.NOT_ASKED,
  simulationLink: '',
  requestError: undefined,
  resetSimulation: () => {},
}

const nestedTx = (status: SimulationStatus): NestedTxStatus => ({ simulation: idleSimulation, status })

describe('_isSimulationSuccessful', () => {
  it('does not report a call trace error as successful', () => {
    // The Safe emitted ExecutionFailure even though the outer Tenderly tx succeeded.
    expect(_isSimulationSuccessful(finishedStatus({ isSuccess: true, isCallTraceError: true }))).toBe(false)
  })

  it('reports a clean successful simulation as successful', () => {
    expect(_isSimulationSuccessful(finishedStatus({ isSuccess: true }))).toBe(true)
  })

  it('does not report an unsuccessful simulation as successful', () => {
    expect(_isSimulationSuccessful(finishedStatus())).toBe(false)
  })

  it('does not report a request error as successful', () => {
    expect(_isSimulationSuccessful(finishedStatus({ isSuccess: true, isError: true }))).toBe(false)
  })

  it('agrees with the shared Safe Shield classifier for every permutation', () => {
    const booleans = [false, true]

    for (const isSuccess of booleans) {
      for (const isError of booleans) {
        for (const isCallTraceError of booleans) {
          const status = finishedStatus({ isSuccess, isError, isCallTraceError })
          const { mainIsSuccess } = getSimulationOutcome(status, nestedTx(status), false)

          expect(_isSimulationSuccessful(status)).toBe(mainIsSuccess)
        }
      }
    }
  })
})

describe('queued simulation display', () => {
  it('shows a failed simulation for a call trace error', () => {
    const status = finishedStatus({ isSuccess: true, isCallTraceError: true })
    const isSuccessful = _isSimulationSuccessful(status)

    expect(_getSimulationStatusText(isSuccessful)).toBe('Simulation failed')
    expect(_getSimulationIcon(isSuccessful).color).toBe('var(--color-error-main)')
  })

  it('shows a successful simulation for a clean run', () => {
    const isSuccessful = _isSimulationSuccessful(finishedStatus({ isSuccess: true }))

    expect(_getSimulationStatusText(isSuccessful)).toBe('Simulation successful')
    expect(_getSimulationIcon(isSuccessful).color).toBe('var(--color-success-main)')
  })
})
