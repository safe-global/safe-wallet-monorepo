import { FETCH_STATUS, type NestedTxStatus } from '@safe-global/utils/components/tx/security/tenderly/types'
import type { UseSimulationReturn } from '@safe-global/utils/components/tx/security/tenderly/useSimulation'
import { getSimulationOutcome, type SimulationStatus } from '@safe-global/utils/components/tx/security/tenderly/utils'
import { render, screen } from '@/tests/test-utils'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { _getSimulationIcon, _getSimulationStatusText, _isSimulationSuccessful, QueuedTxSimulation } from './index'

const mockUseSafeProAccess = jest.fn()
const mockSimulateTransaction = jest.fn()
jest.mock('@/features/spaces', () => ({ useSafeProAccess: () => mockUseSafeProAccess() }))
jest.mock('@safe-global/utils/components/tx/security/tenderly/utils', () => ({
  ...jest.requireActual('@safe-global/utils/components/tx/security/tenderly/utils'),
  isTxSimulationEnabled: () => true,
}))
jest.mock('@/hooks/useChains', () => ({ useCurrentChain: () => ({ chainId: '1', features: ['TX_SIMULATION'] }) }))
jest.mock('@/hooks/useChainId', () => ({ __esModule: true, default: () => '1' }))
jest.mock('@/hooks/useIsSafeOwner', () => ({ __esModule: true, default: () => true }))
jest.mock('@/hooks/useIsNestedSafeOwner', () => ({ useIsNestedSafeOwner: () => false }))
jest.mock('@/hooks/wallets/useWallet', () => ({
  useSigner: () => ({ address: '0x1111111111111111111111111111111111111111' }),
}))
jest.mock('@/hooks/coreSDK/safeCoreSDK', () => ({ useSafeSDK: () => ({}) }))
jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: () => ({
    safe: {
      address: { value: '0x1234567890123456789012345678901234567890' },
      owners: [{ value: '0x1111111111111111111111111111111111111111' }],
    },
  }),
}))
jest.mock('@/services/tx/tx-sender', () => ({
  createExistingTx: async () => ({
    data: { to: '0x00000000000000000000000000000000000000aa', value: '0', data: '0xa9059cbb', operation: 0 },
  }),
}))
jest.mock('@/components/tx/security/tenderly/useSimulation', () => ({
  useSimulation: () => ({
    simulateTransaction: mockSimulateTransaction,
    simulationData: undefined,
    _simulationRequestStatus: 'NOT_ASKED',
    simulationLink: '',
    requestError: undefined,
    resetSimulation: () => {},
  }),
}))

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

describe('QueuedTxSimulation gating', () => {
  const transaction = { txId: 'multisig_0x1_0x2' } as TransactionDetails

  it('hands off to Tenderly public simulator instead of simulating without Safe Pro', async () => {
    mockUseSafeProAccess.mockReturnValue({ hasProFeatures: false, isLoading: false })
    render(<QueuedTxSimulation transaction={transaction} />)

    const link = await screen.findByTestId('queued-tx-external-simulation')
    const url = new URL(link.getAttribute('href') ?? '')
    expect(url.pathname).toBe('/simulator/new')
    expect(url.searchParams.get('contractAddress')).toBe('0x00000000000000000000000000000000000000aa')
    expect(url.searchParams.get('from')).toBe('0x1234567890123456789012345678901234567890')
    expect(screen.queryByRole('button', { name: /Simulate/ })).not.toBeInTheDocument()
    expect(mockSimulateTransaction).not.toHaveBeenCalled()
  })

  it('keeps the in-app simulation button with Safe Pro', async () => {
    mockUseSafeProAccess.mockReturnValue({ hasProFeatures: true, isLoading: false })
    render(<QueuedTxSimulation transaction={transaction} />)

    expect(await screen.findByRole('button', { name: /Simulate/ })).toBeInTheDocument()
    expect(screen.queryByTestId('queued-tx-external-simulation')).not.toBeInTheDocument()
  })
})
