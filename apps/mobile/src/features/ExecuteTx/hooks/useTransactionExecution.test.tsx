import { renderHook, act, waitFor } from '@testing-library/react-native'
import { Provider } from 'react-redux'
import React from 'react'
import { RelaySimulationError } from '@safe-global/utils/services/relayErrors'

const mockExecuteRelayTx = jest.fn()
const mockRelayMutation = jest.fn()

jest.mock('@/src/services/tx-execution/relayExecutor', () => ({
  executeRelayTx: (...args: unknown[]) => mockExecuteRelayTx(...args),
}))
jest.mock('@/src/services/tx-execution/privateKeyExecutor', () => ({ executePrivateKeyTx: jest.fn() }))
jest.mock('@/src/services/tx-execution/ledgerExecutor', () => ({ executeLedgerTx: jest.fn() }))
jest.mock('@/src/services/tx-execution/walletConnectExecutor', () => ({ executeWalletConnectTx: jest.fn() }))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/relay', () => ({
  useRelayRelayV1Mutation: () => [() => ({ unwrap: () => mockRelayMutation() })],
}))

// The real store's pendingTxs middleware starts a RelayTxWatcher that polls the CGW relay status
// endpoint over the network. Mock it so the watcher never makes real requests; watchTaskId returns a
// promise that never settles, keeping the tx in PROCESSING like a real relay still in flight.
jest.mock('@safe-global/utils/services/RelayTxWatcher', () => ({
  TIMEOUT_ERROR_CODE: 'TIMEOUT',
  RelayTxWatcher: {
    getInstance: () => ({
      watchTaskId: jest.fn(
        () =>
          new Promise(() => {
            // Never resolves, keeps tx in PROCESSING
          }),
      ),
      stopWatchingTaskId: jest.fn(),
    }),
  },
}))

jest.mock('@/src/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: () => ({ safe: { address: { value: '0xSafe' }, chainId: '137' } }),
}))

jest.mock('@/src/store/hooks/activeSafe', () => ({
  useDefinedActiveSafe: () => ({ address: '0xSafe', chainId: '137' }),
}))

jest.mock('@/src/store/chains', () => ({
  selectChainById: jest.fn(),
}))

// useAppSelector(selectChainById) → return a minimal chain
jest.mock('@/src/store/hooks', () => {
  const actual = jest.requireActual('@/src/store/hooks')
  return {
    ...actual,
    useAppSelector: () => ({ chainId: '137' }),
  }
})

import { makeStore } from '@/src/store'
import { useTransactionExecution, ExecutionStatus } from './useTransactionExecution'
import { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'

describe('useTransactionExecution', () => {
  let store: ReturnType<typeof makeStore>

  const renderExecution = () =>
    renderHook(
      () =>
        useTransactionExecution({
          txId: 'tx123',
          signerAddress: '0xSigner',
          feeParams: null,
          executionMethod: ExecutionMethod.WITH_RELAY,
        }),
      { wrapper: ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider> },
    )

  beforeEach(() => {
    jest.clearAllMocks()
    store = makeStore()
    mockExecuteRelayTx.mockResolvedValue({
      type: ExecutionMethod.WITH_RELAY,
      txId: 'tx123',
      taskId: 'task456',
      chainId: '137',
      safeAddress: '0xSafe',
    })
  })

  it('executes a relay tx and transitions to PROCESSING', async () => {
    const { result } = renderExecution()

    await act(async () => {
      await result.current.execute()
    })

    expect(mockExecuteRelayTx).toHaveBeenCalledWith(expect.objectContaining({ acceptUnverifiedSimulation: undefined }))
    await waitFor(() => expect(result.current.status).toBe(ExecutionStatus.PROCESSING))
  })

  it('exposes the RelaySimulationError on a 422 and rethrows it', async () => {
    const simulationError = new RelaySimulationError('SIMULATION_FAILED', 'Insufficient gas-token balance')
    mockExecuteRelayTx.mockRejectedValue(simulationError)

    const { result } = renderExecution()

    await act(async () => {
      await expect(result.current.execute()).rejects.toBe(simulationError)
    })

    expect(result.current.simulationError).toBe(simulationError)
    expect(result.current.status).toBe(ExecutionStatus.ERROR)
  })

  it('retryWithAcceptUnverified re-runs the relay with acceptUnverifiedSimulation = true', async () => {
    const { result } = renderExecution()

    await act(async () => {
      await result.current.retryWithAcceptUnverified()
    })

    expect(mockExecuteRelayTx).toHaveBeenCalledWith(expect.objectContaining({ acceptUnverifiedSimulation: true }))
  })

  it('clears a previous simulationError when a retry starts', async () => {
    const simulationError = new RelaySimulationError('INDETERMINATE_SIMULATION', 'Could not simulate')
    mockExecuteRelayTx.mockRejectedValueOnce(simulationError).mockResolvedValueOnce({
      type: ExecutionMethod.WITH_RELAY,
      txId: 'tx123',
      taskId: 'task456',
      chainId: '137',
      safeAddress: '0xSafe',
    })

    const { result } = renderExecution()

    await act(async () => {
      await expect(result.current.execute()).rejects.toBe(simulationError)
    })
    expect(result.current.simulationError).toBe(simulationError)

    await act(async () => {
      await result.current.retryWithAcceptUnverified()
    })
    expect(result.current.simulationError).toBeUndefined()
  })
})
