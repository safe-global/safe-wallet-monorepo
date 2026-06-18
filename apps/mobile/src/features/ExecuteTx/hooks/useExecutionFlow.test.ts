import { renderHook, act, waitFor } from '@testing-library/react-native'
import { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'
import type { FeeParams } from '@/src/hooks/useFeeParams/useFeeParams'
import type { Signer } from '@/src/store/signersSlice'

// Mock expo-router
const mockPush = jest.fn()
const mockReplace = jest.fn()
jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
    replace: (...args: unknown[]) => mockReplace(...args),
  },
}))

import { useExecutionFlow } from './useExecutionFlow'
import { RelaySimulationError } from '@safe-global/utils/services/relayErrors'

describe('useExecutionFlow', () => {
  const mockExecute = jest.fn()

  const mockPrivateKeySigner: Signer = {
    value: '0x123',
    name: 'Test Signer',
    type: 'private-key',
  }

  const mockLedgerSigner: Signer = {
    value: '0x456',
    name: 'Ledger Signer',
    type: 'ledger',
    derivationPath: "m/44'/60'/0'/0/0",
  }

  const mockWalletConnectSigner: Signer = {
    value: '0x789',
    name: 'WC Signer',
    type: 'walletconnect',
    walletName: 'MetaMask',
  }

  const mockFeeParams: FeeParams = {
    maxFeePerGas: BigInt('1000000000'),
    maxPriorityFeePerGas: BigInt('100000000'),
    gasLimit: BigInt('21000'),
    nonce: 5,
    isLoadingGasPrice: false,
    gasLimitLoading: false,
  }

  const defaultParams = {
    txId: 'tx123',
    activeSigner: mockPrivateKeySigner,
    isBiometricsEnabled: true,
    executionMethod: ExecutionMethod.WITH_PK,
    feeParams: mockFeeParams,
    execute: mockExecute,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockExecute.mockResolvedValue(undefined)
  })

  describe('initial state', () => {
    it('should start with isExecuting as false', () => {
      const { result } = renderHook(() => useExecutionFlow(defaultParams))
      expect(result.current.isExecuting).toBe(false)
    })
  })

  describe('Ledger flow', () => {
    it('should navigate to ledger-connect when signer is Ledger', async () => {
      const { result } = renderHook(() =>
        useExecutionFlow({
          ...defaultParams,
          activeSigner: mockLedgerSigner,
        }),
      )

      await act(async () => {
        await result.current.handleConfirmPress()
      })

      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/execute-transaction/ledger-connect',
        params: expect.objectContaining({
          txId: 'tx123',
          executionMethod: ExecutionMethod.WITH_PK,
        }),
      })
      expect(mockExecute).not.toHaveBeenCalled()
    })

    it('should use standard flow when relay is selected, even with Ledger signer', async () => {
      const { result } = renderHook(() =>
        useExecutionFlow({
          ...defaultParams,
          activeSigner: mockLedgerSigner,
          executionMethod: ExecutionMethod.WITH_RELAY,
        }),
      )

      await act(async () => {
        await result.current.handleConfirmPress()
      })

      // Should execute directly (standard flow) instead of navigating to Ledger flow
      expect(mockExecute).toHaveBeenCalled()
      expect(mockPush).not.toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/execute-transaction/ledger-connect',
        }),
      )
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: '/execution-success',
        params: { txId: 'tx123' },
      })
    })
  })

  describe('biometrics flow', () => {
    it('should navigate to biometrics-opt-in when biometrics not enabled', async () => {
      const { result } = renderHook(() =>
        useExecutionFlow({
          ...defaultParams,
          isBiometricsEnabled: false,
        }),
      )

      await act(async () => {
        await result.current.handleConfirmPress()
      })

      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/biometrics-opt-in',
        params: expect.objectContaining({
          txId: 'tx123',
          caller: '/review-and-execute',
        }),
      })
      expect(mockExecute).not.toHaveBeenCalled()
    })
  })

  describe('WalletConnect flow', () => {
    it('should execute directly without ledger or biometrics redirect', async () => {
      const { result } = renderHook(() =>
        useExecutionFlow({
          ...defaultParams,
          activeSigner: mockWalletConnectSigner,
          executionMethod: ExecutionMethod.WITH_WC,
        }),
      )

      await act(async () => {
        await result.current.handleConfirmPress()
      })

      expect(mockExecute).toHaveBeenCalled()
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: '/execution-success',
        params: { txId: 'tx123' },
      })
      expect(mockPush).not.toHaveBeenCalledWith(
        expect.objectContaining({ pathname: '/execute-transaction/ledger-connect' }),
      )
      expect(mockPush).not.toHaveBeenCalledWith(expect.objectContaining({ pathname: '/biometrics-opt-in' }))
    })

    it('should skip biometrics even when biometrics is not enabled', async () => {
      const { result } = renderHook(() =>
        useExecutionFlow({
          ...defaultParams,
          activeSigner: mockWalletConnectSigner,
          executionMethod: ExecutionMethod.WITH_WC,
          isBiometricsEnabled: false,
        }),
      )

      await act(async () => {
        await result.current.handleConfirmPress()
      })

      expect(mockExecute).toHaveBeenCalled()
      expect(mockPush).not.toHaveBeenCalledWith(expect.objectContaining({ pathname: '/biometrics-opt-in' }))
    })
  })

  describe('standard execution flow', () => {
    it('should execute and navigate to success on success', async () => {
      const { result } = renderHook(() => useExecutionFlow(defaultParams))

      await act(async () => {
        await result.current.handleConfirmPress()
      })

      expect(mockExecute).toHaveBeenCalled()
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: '/execution-success',
        params: { txId: 'tx123' },
      })
    })

    it('should set isExecuting to true during execution', async () => {
      let resolveExecute: (() => void) | undefined
      mockExecute.mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolveExecute = resolve
          }),
      )

      const { result } = renderHook(() => useExecutionFlow(defaultParams))

      // Start execution
      act(() => {
        result.current.handleConfirmPress()
      })

      // Check isExecuting is true during execution
      await waitFor(() => expect(result.current.isExecuting).toBe(true))

      // Complete execution
      await act(async () => {
        if (resolveExecute) {
          resolveExecute()
        }
      })
    })

    it('should navigate to error screen on failure', async () => {
      mockExecute.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useExecutionFlow(defaultParams))

      await act(async () => {
        await result.current.handleConfirmPress()
      })

      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/execution-error',
        params: { description: 'Network error' },
      })
    })

    it('should reset isExecuting on error', async () => {
      mockExecute.mockRejectedValue(new Error('Failed'))

      const { result } = renderHook(() => useExecutionFlow(defaultParams))

      await act(async () => {
        await result.current.handleConfirmPress()
      })

      expect(result.current.isExecuting).toBe(false)
    })

    it('should not execute if already executing', async () => {
      let resolveExecute: (() => void) | undefined
      mockExecute.mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolveExecute = resolve
          }),
      )

      const { result } = renderHook(() => useExecutionFlow(defaultParams))

      // Start first execution
      act(() => {
        result.current.handleConfirmPress()
      })

      await waitFor(() => expect(result.current.isExecuting).toBe(true))

      // Try to execute again while still executing
      await act(async () => {
        await result.current.handleConfirmPress()
      })

      // Should only have been called once
      expect(mockExecute).toHaveBeenCalledTimes(1)

      // Cleanup
      await act(async () => {
        if (resolveExecute) {
          resolveExecute()
        }
      })
    })
  })

  describe('relay simulation errors', () => {
    it('SIMULATION_FAILED is terminal => navigates to the error screen, no retry sheet', async () => {
      mockExecute.mockRejectedValue(new RelaySimulationError('SIMULATION_FAILED', 'Insufficient gas-token balance'))

      const { result } = renderHook(() =>
        useExecutionFlow({ ...defaultParams, executionMethod: ExecutionMethod.WITH_RELAY }),
      )

      await act(async () => {
        await result.current.handleConfirmPress()
      })

      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/execution-error',
        params: { description: 'Insufficient gas-token balance' },
      })
      expect(result.current.showIndeterminateSheet).toBe(false)
    })

    it('INDETERMINATE_SIMULATION shows the confirmation sheet instead of the error screen', async () => {
      mockExecute.mockRejectedValue(new RelaySimulationError('INDETERMINATE_SIMULATION', 'Could not simulate'))

      const { result } = renderHook(() =>
        useExecutionFlow({ ...defaultParams, executionMethod: ExecutionMethod.WITH_RELAY }),
      )

      await act(async () => {
        await result.current.handleConfirmPress()
      })

      expect(result.current.showIndeterminateSheet).toBe(true)
      expect(mockPush).not.toHaveBeenCalledWith(expect.objectContaining({ pathname: '/execution-error' }))
    })

    it('confirmExecuteAnyway re-runs execution with acceptUnverifiedSimulation = true', async () => {
      mockExecute
        .mockRejectedValueOnce(new RelaySimulationError('INDETERMINATE_SIMULATION', 'Could not simulate'))
        .mockResolvedValueOnce(undefined)

      const { result } = renderHook(() =>
        useExecutionFlow({ ...defaultParams, executionMethod: ExecutionMethod.WITH_RELAY }),
      )

      await act(async () => {
        await result.current.handleConfirmPress()
      })

      await act(async () => {
        await result.current.confirmExecuteAnyway()
      })

      expect(mockExecute).toHaveBeenNthCalledWith(1, undefined)
      expect(mockExecute).toHaveBeenNthCalledWith(2, true)
      expect(result.current.showIndeterminateSheet).toBe(false)
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: '/execution-success',
        params: { txId: 'tx123' },
      })
    })

    it('dismissIndeterminateSheet closes the sheet without executing', async () => {
      mockExecute.mockRejectedValue(new RelaySimulationError('INDETERMINATE_SIMULATION', 'Could not simulate'))

      const { result } = renderHook(() =>
        useExecutionFlow({ ...defaultParams, executionMethod: ExecutionMethod.WITH_RELAY }),
      )

      await act(async () => {
        await result.current.handleConfirmPress()
      })

      act(() => {
        result.current.dismissIndeterminateSheet()
      })

      expect(result.current.showIndeterminateSheet).toBe(false)
      expect(mockExecute).toHaveBeenCalledTimes(1)
    })
  })

  describe('route params', () => {
    it('should include fee params in route navigation', async () => {
      const { result } = renderHook(() =>
        useExecutionFlow({
          ...defaultParams,
          activeSigner: mockLedgerSigner,
        }),
      )

      await act(async () => {
        await result.current.handleConfirmPress()
      })

      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/execute-transaction/ledger-connect',
        params: {
          txId: 'tx123',
          executionMethod: ExecutionMethod.WITH_PK,
          maxFeePerGas: '1000000000',
          maxPriorityFeePerGas: '100000000',
          gasLimit: '21000',
          nonce: '5',
        },
      })
    })
  })
})
