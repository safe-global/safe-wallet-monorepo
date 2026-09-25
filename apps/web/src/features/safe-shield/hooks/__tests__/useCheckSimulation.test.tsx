import type { ReactNode } from 'react'
import { renderHook } from '@/tests/test-utils'
import { FETCH_STATUS } from '@safe-global/utils/components/tx/security/tenderly/types'
import type { SimulationStatus } from '@safe-global/utils/components/tx/security/tenderly/utils'
import type { UseSimulationReturn } from '@safe-global/utils/components/tx/security/tenderly/useSimulation'
import { TxInfoContext } from '@/components/tx-flow/TxInfoProvider'
import { safeTxBuilder } from '@/tests/builders/safeTx'
import { useCheckSimulation } from '../useCheckSimulation'

jest.mock('@/hooks/useChains', () => ({ useCurrentChain: () => ({ chainId: '1', features: ['TX_SIMULATION'] }) }))
let mockSimulationEnabled = true
jest.mock('@safe-global/utils/components/tx/security/tenderly/utils', () => ({
  ...jest.requireActual('@safe-global/utils/components/tx/security/tenderly/utils'),
  isTxSimulationEnabled: () => mockSimulationEnabled,
}))
jest.mock('../../components/useNestedTransaction', () => ({ useNestedTransaction: () => ({ isNested: false }) }))

const simulation: UseSimulationReturn = {
  simulateTransaction: jest.fn(),
  resetSimulation: jest.fn(),
  simulationLink: '',
  simulationData: undefined,
  requestError: undefined,
  _simulationRequestStatus: FETCH_STATUS.NOT_ASKED,
}

const renderWithStatus = (status: SimulationStatus, safeTx = safeTxBuilder().build()) => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <TxInfoContext.Provider value={{ simulation, status, nestedTx: { simulation, status } }}>
      {children}
    </TxInfoContext.Provider>
  )
  return renderHook(() => useCheckSimulation(safeTx), { wrapper }).result.current
}

const finished = (isSuccess: boolean): SimulationStatus => ({
  isLoading: false,
  isFinished: true,
  isSuccess,
  isCallTraceError: false,
  isError: !isSuccess,
})

describe('useCheckSimulation', () => {
  beforeEach(() => {
    mockSimulationEnabled = true
  })

  it('reports a successful simulation once it finished', () => {
    expect(renderWithStatus(finished(true)).isSimulationSuccess).toBe(true)
  })

  it('does not report success while the simulation has not finished or failed', () => {
    expect(renderWithStatus({ ...finished(true), isFinished: false }).isSimulationSuccess).toBe(false)
    expect(renderWithStatus(finished(false)).isSimulationSuccess).toBe(false)
  })

  it('does not report success when the simulation is off', () => {
    mockSimulationEnabled = false
    expect(renderWithStatus(finished(true)).isSimulationSuccess).toBe(false)
  })
})
