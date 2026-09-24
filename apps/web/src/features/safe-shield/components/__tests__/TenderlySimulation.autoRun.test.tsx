import { render, screen } from '@/tests/test-utils'
import { FETCH_STATUS } from '@safe-global/utils/components/tx/security/tenderly/types'
import type { UseSimulationReturn } from '@safe-global/utils/components/tx/security/tenderly/useSimulation'
import { TxInfoContext } from '@/components/tx-flow/TxInfoProvider'
import { safeTxBuilder } from '@/tests/builders/safeTx'
import { Builder } from '@/tests/Builder'
import type { SafeInfo } from '@safe-global/safe-gateway-typescript-sdk'
import type { UseNestedTransactionResult } from '../useNestedTransaction'
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
const OWNER = '0x00000000000000000000000000000000000000f1'
let mockOwners = [{ value: OWNER }]
jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: () => ({ safe: { chainId: '1', owners: mockOwners } }),
}))
let mockSigner: { address: string } | undefined
jest.mock('@/hooks/wallets/useWallet', () => ({ useSigner: () => mockSigner }))
jest.mock('@/hooks/useIsSafeOwner', () => ({ __esModule: true, default: () => false }))
jest.mock('@/hooks/useSafeAddress', () => ({
  __esModule: true,
  default: () => '0x1234567890123456789012345678901234567890',
}))
const notNested: UseNestedTransactionResult = {
  isNested: false,
  isNestedLoading: false,
  nestedSafeInfo: undefined,
  nestedSafeTx: undefined,
}
let mockNested = notNested
const nested = (): UseNestedTransactionResult => ({
  isNested: true,
  isNestedLoading: false,
  nestedSafeInfo: Builder.new<SafeInfo>()
    .with({ address: { value: '0x00000000000000000000000000000000000000b1' } })
    .build(),
  nestedSafeTx: safeTxBuilder().build(),
})
jest.mock('../useNestedTransaction', () => ({ useNestedTransaction: () => mockNested }))
jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
}))

const safeTx = safeTxBuilder().build()

const idle = { isLoading: false, isFinished: false, isSuccess: false, isCallTraceError: false, isError: false }

const buildSimulation = (): UseSimulationReturn => ({
  simulateTransaction: jest.fn(),
  resetSimulation: jest.fn(),
  simulationLink: '',
  simulationData: undefined,
  requestError: undefined,
  _simulationRequestStatus: FETCH_STATUS.NOT_ASKED,
})

const renderWithContext = (ui: React.ReactElement) => {
  const simulation = buildSimulation()
  const nestedSimulation = buildSimulation()
  const withContext = (node: React.ReactElement) => (
    <TxInfoContext.Provider
      value={{ simulation, status: idle, nestedTx: { simulation: nestedSimulation, status: idle } }}
    >
      {node}
    </TxInfoContext.Provider>
  )
  const { rerender } = render(withContext(ui))
  return {
    simulateTransaction: jest.mocked(simulation.simulateTransaction),
    simulateNestedTransaction: jest.mocked(nestedSimulation.simulateTransaction),
    rerender: (node: React.ReactElement) => rerender(withContext(node)),
  }
}

describe('TenderlySimulation auto-run', () => {
  beforeEach(() => {
    mockOwners = [{ value: OWNER }]
    mockSigner = undefined
    mockNested = notNested
  })

  it('starts the simulation on its own, once per transaction, and shows no Run button', () => {
    const { simulateTransaction, rerender } = renderWithContext(<TenderlySimulation safeTx={safeTx} autoRun />)

    expect(simulateTransaction).toHaveBeenCalledTimes(1)
    expect(simulateTransaction.mock.calls[0][0]).toMatchObject({ transactions: safeTx, executionOwner: OWNER })
    expect(screen.queryByTestId('run-simulation-btn')).not.toBeInTheDocument()

    rerender(<TenderlySimulation safeTx={{ ...safeTx }} autoRun />)
    expect(simulateTransaction).toHaveBeenCalledTimes(1)
  })

  it('waits for the Safe owners when the connected wallet is not an owner', () => {
    mockSigner = { address: '0x00000000000000000000000000000000000000e1' }
    mockOwners = []
    const { simulateTransaction, rerender } = renderWithContext(<TenderlySimulation safeTx={safeTx} autoRun />)
    expect(simulateTransaction).not.toHaveBeenCalled()

    mockOwners = [{ value: OWNER }]
    rerender(<TenderlySimulation safeTx={safeTx} autoRun />)
    expect(simulateTransaction).toHaveBeenCalledTimes(1)
    expect(simulateTransaction.mock.calls[0][0]).toMatchObject({ executionOwner: OWNER })
  })

  it('also runs the nested simulation once the nested transaction resolves', () => {
    mockNested = { ...notNested, isNestedLoading: true }
    const { simulateTransaction, simulateNestedTransaction, rerender } = renderWithContext(
      <TenderlySimulation safeTx={safeTx} autoRun />,
    )
    expect(simulateTransaction).not.toHaveBeenCalled()

    mockNested = nested()
    rerender(<TenderlySimulation safeTx={safeTx} autoRun />)
    expect(simulateTransaction).toHaveBeenCalledTimes(1)
    expect(simulateNestedTransaction).toHaveBeenCalledTimes(1)
  })

  it('reruns with the nested simulation when the nested transaction resolves after the first run', () => {
    const { simulateTransaction, simulateNestedTransaction, rerender } = renderWithContext(
      <TenderlySimulation safeTx={safeTx} autoRun />,
    )
    expect(simulateTransaction).toHaveBeenCalledTimes(1)
    expect(simulateNestedTransaction).not.toHaveBeenCalled()

    mockNested = nested()
    rerender(<TenderlySimulation safeTx={safeTx} autoRun />)
    expect(simulateNestedTransaction).toHaveBeenCalledTimes(1)
  })

  it('waits for a click without auto-run', () => {
    const { simulateTransaction } = renderWithContext(<TenderlySimulation safeTx={safeTx} />)

    expect(simulateTransaction).not.toHaveBeenCalled()
    expect(screen.getByTestId('run-simulation-btn')).toHaveTextContent('Run')
  })
})
