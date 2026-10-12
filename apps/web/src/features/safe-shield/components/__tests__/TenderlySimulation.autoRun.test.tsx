import { render, screen } from '@/tests/test-utils'
import type { SafeTransaction } from '@safe-global/types-kit'
import { FETCH_STATUS } from '@safe-global/utils/components/tx/security/tenderly/types'
import { TxInfoContext } from '@/components/tx-flow/TxInfoProvider'
import { TenderlySimulation } from '../TenderlySimulation'

// Explicit stubs: spreading the real module here pulls a circular import chain into the mock factory.
jest.mock('@/hooks/useChains', () => ({
  useCurrentChain: () => ({ chainId: '1', features: ['TX_SIMULATION'] }),
  useHasFeature: () => true,
}))
jest.mock('@safe-global/utils/components/tx/security/tenderly/utils', () => ({
  ...jest.requireActual('@safe-global/utils/components/tx/security/tenderly/utils'),
  isTxSimulationEnabled: () => true,
}))
jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: () => ({ safe: { chainId: '1', owners: [{ value: '0x00000000000000000000000000000000000000f1' }] } }),
}))
jest.mock('@/hooks/wallets/useWallet', () => ({ useSigner: () => undefined }))
jest.mock('@/hooks/useIsSafeOwner', () => ({ __esModule: true, default: () => false }))
jest.mock('@/hooks/useSafeAddress', () => ({
  __esModule: true,
  default: () => '0x1234567890123456789012345678901234567890',
}))
const mockUseNestedTransaction = jest.fn()
jest.mock('../useNestedTransaction', () => ({ useNestedTransaction: () => mockUseNestedTransaction() }))
jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
}))

const safeTx = {
  data: { to: '0x00000000000000000000000000000000000000aa', value: '0', data: '0x', operation: 0 },
} as unknown as SafeTransaction

const idle = { isLoading: false, isFinished: false, isSuccess: false, isCallTraceError: false, isError: false }

const renderWithContext = (ui: React.ReactElement, simulateTransaction = jest.fn()) => {
  const simulation = {
    simulateTransaction,
    resetSimulation: jest.fn(),
    simulationLink: '',
    simulationData: undefined,
    requestError: undefined,
    _simulationRequestStatus: FETCH_STATUS.NOT_ASKED,
  } as never
  const withContext = (node: React.ReactElement) => (
    <TxInfoContext.Provider value={{ simulation, status: idle, nestedTx: { simulation, status: idle } }}>
      {node}
    </TxInfoContext.Provider>
  )
  const result = render(withContext(ui))
  return { simulateTransaction, rerender: (node: React.ReactElement) => result.rerender(withContext(node)) }
}

describe('TenderlySimulation auto-run', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseNestedTransaction.mockReturnValue({ isNested: false, isNestedLoading: false })
  })

  it('starts the simulation on its own, once per transaction, and shows no Run button', () => {
    const { simulateTransaction, rerender } = renderWithContext(<TenderlySimulation safeTx={safeTx} autoRun />)

    expect(simulateTransaction).toHaveBeenCalledTimes(1)
    expect(simulateTransaction.mock.calls[0][0]).toMatchObject({
      transactions: safeTx,
      executionOwner: '0x00000000000000000000000000000000000000f1',
    })
    expect(screen.queryByTestId('run-simulation-btn')).not.toBeInTheDocument()

    rerender(<TenderlySimulation safeTx={{ ...safeTx } as SafeTransaction} autoRun />)
    expect(simulateTransaction).toHaveBeenCalledTimes(1)
  })

  it('waits for a nested Safe to load, then runs both simulations once', () => {
    mockUseNestedTransaction.mockReturnValue({ isNested: false, isNestedLoading: true })
    const { simulateTransaction, rerender } = renderWithContext(<TenderlySimulation safeTx={safeTx} autoRun />)

    expect(simulateTransaction).not.toHaveBeenCalled()
    expect(screen.getByText('Running...')).toBeInTheDocument()

    const nestedSafeTx = { data: { to: '0x00000000000000000000000000000000000000bb' } } as unknown as SafeTransaction
    mockUseNestedTransaction.mockReturnValue({
      isNested: true,
      isNestedLoading: false,
      nestedSafeInfo: { address: { value: '0x00000000000000000000000000000000000000bb' } },
      nestedSafeTx,
    })
    rerender(<TenderlySimulation safeTx={safeTx} autoRun />)

    expect(simulateTransaction).toHaveBeenCalledTimes(2)
    expect(simulateTransaction.mock.calls[0][0]).toMatchObject({ transactions: safeTx })
    expect(simulateTransaction.mock.calls[1][0]).toMatchObject({ transactions: nestedSafeTx })
  })

  it('waits for a click without auto-run', () => {
    const { simulateTransaction } = renderWithContext(<TenderlySimulation safeTx={safeTx} />)

    expect(simulateTransaction).not.toHaveBeenCalled()
    expect(screen.getByTestId('run-simulation-btn')).toHaveTextContent('Run')
  })
})
