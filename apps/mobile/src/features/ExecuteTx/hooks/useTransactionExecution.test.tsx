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

const DEFAULT_SAFE_INFO = { address: { value: '0xSafe' }, chainId: '137' }
let mockSafeInfo: Record<string, unknown> = DEFAULT_SAFE_INFO

jest.mock('@/src/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: () => ({ safe: mockSafeInfo }),
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
import { CONTRACT_ERROR_FALLBACK, getContractErrorMessage } from '@safe-global/utils/services/exceptions/contractErrors'

describe('useTransactionExecution', () => {
  let store: ReturnType<typeof makeStore>

  const renderExecution = (overrides: { confirmedSigners?: string[] } = {}) =>
    renderHook(
      () =>
        useTransactionExecution({
          txId: 'tx123',
          signerAddress: '0xSigner',
          feeParams: null,
          executionMethod: ExecutionMethod.WITH_RELAY,
          ...overrides,
        }),
      { wrapper: ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider> },
    )

  const getStoredError = () => store.getState().executingState.executions['tx123']?.error

  beforeEach(() => {
    jest.clearAllMocks()
    mockSafeInfo = DEFAULT_SAFE_INFO
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

  it('rethrows a RelaySimulationError so the flow can branch on it, and goes to ERROR status', async () => {
    const simulationError = new RelaySimulationError('SIMULATION_FAILED', 'Insufficient gas-token balance')
    mockExecuteRelayTx.mockRejectedValue(simulationError)

    const { result } = renderExecution()

    await act(async () => {
      await expect(result.current.execute()).rejects.toBe(simulationError)
    })

    expect(result.current.status).toBe(ExecutionStatus.ERROR)
  })

  it('forwards acceptUnverifiedSimulation = true when execute is retried with the accepted risk', async () => {
    const { result } = renderExecution()

    await act(async () => {
      await result.current.execute(true)
    })

    expect(mockExecuteRelayTx).toHaveBeenCalledWith(expect.objectContaining({ acceptUnverifiedSimulation: true }))
  })

  describe('contract revert classification (WA-2297)', () => {
    const viemDump = () =>
      Object.assign(
        new Error(
          [
            'The contract function "execTransaction" reverted with the following reason:',
            'GS013',
            '',
            'Contract Call:',
            '  function:  execTransaction(address to, uint256 value, bytes data)',
            '  args:            (0x94Bb1a1d1b0dEE1F0e3d1234567890abcdef1234, 0, 0xeb37acfc)',
            '',
            'Version: viem@2.21.54',
          ].join('\n'),
        ),
        { name: 'ContractFunctionExecutionError' },
      )

    it('never stores the raw viem dump for a GS revert', async () => {
      mockExecuteRelayTx.mockRejectedValue(viemDump())

      const { result } = renderExecution()

      await act(async () => {
        await expect(result.current.execute()).rejects.toThrow(CONTRACT_ERROR_FALLBACK)
      })

      const stored = getStoredError()
      expect(stored).toBe(CONTRACT_ERROR_FALLBACK)
      expect(stored).not.toMatch(/ContractFunctionExecutionError|execTransaction|args:|viem/)
    })

    it('stores an actionable message when the signer cannot cover the network fee', async () => {
      mockExecuteRelayTx.mockRejectedValue(
        new Error('The total cost (gas * gas fee + value) of executing this transaction exceeds the balance.'),
      )

      const { result } = renderExecution()

      await act(async () => {
        await expect(result.current.execute()).rejects.toThrow(/Add funds and try again/)
      })

      expect(getStoredError()).toMatch(/^Not enough funds in your signer wallet to cover the network fee\./)
    })

    it('leaves an app-level error untouched', async () => {
      mockExecuteRelayTx.mockRejectedValue(new Error('Private key not found'))

      const { result } = renderExecution()

      await act(async () => {
        await expect(result.current.execute()).rejects.toThrow('Private key not found')
      })

      expect(getStoredError()).toBe('Private key not found')
    })
  })

  describe('missing signatures pre-check (WA-2297)', () => {
    const OWNER_A = '0xAAaAaA2A6E1B1c2d3E4f5061728394A5b6C7d8E9'
    const OWNER_B = '0xBbBBbB2A6E1B1c2d3E4f5061728394A5b6C7d8E9'

    beforeEach(() => {
      mockSafeInfo = {
        ...DEFAULT_SAFE_INFO,
        threshold: 2,
        owners: [{ value: OWNER_A }, { value: OWNER_B }],
      }
    })

    it('blocks before broadcasting when the threshold cannot be met', async () => {
      const { result } = renderExecution({ confirmedSigners: [OWNER_A] })

      await act(async () => {
        await expect(result.current.execute()).rejects.toThrow(getContractErrorMessage('GS025'))
      })

      expect(mockExecuteRelayTx).not.toHaveBeenCalled()
      expect(getStoredError()).toBe(getContractErrorMessage('GS025'))
    })

    it('executes once enough signers have confirmed', async () => {
      const { result } = renderExecution({ confirmedSigners: [OWNER_A, OWNER_B] })

      await act(async () => {
        await result.current.execute()
      })

      expect(mockExecuteRelayTx).toHaveBeenCalled()
    })
  })
})
