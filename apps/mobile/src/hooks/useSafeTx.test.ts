import { renderHook, waitFor } from '@testing-library/react-native'
import { faker } from '@faker-js/faker'
import useSafeTx from './useSafeTx'
import * as activeSafeHook from '@/src/store/hooks/activeSafe'
import * as safeCoreSDKHook from '@/src/hooks/coreSDK/safeCoreSDK'
import * as extractTxModule from '@/src/services/tx/extractTx'
import * as txSenderModule from '@/src/services/tx/tx-sender'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { SafeTransactionData } from '@safe-global/types-kit'
import type Safe from '@safe-global/protocol-kit'
import { generateChecksummedAddress, createMockSafeTx } from '@safe-global/test'

jest.mock('@/src/store/hooks/activeSafe')
jest.mock('@/src/hooks/coreSDK/safeCoreSDK')
jest.mock('@/src/services/tx/extractTx')
jest.mock('@/src/services/tx/tx-sender')

const createMockTxDetails = (overrides: Partial<TransactionDetails> = {}): TransactionDetails =>
  ({
    safeAddress: generateChecksummedAddress(),
    txId: faker.string.uuid(),
    executedAt: null,
    txStatus: 'AWAITING_CONFIRMATIONS',
    txInfo: {
      type: 'Custom',
      to: { value: generateChecksummedAddress() },
      value: '0',
      dataSize: '0',
      methodName: null,
      isCancellation: false,
    },
    txData: {
      hexData: '0x',
      dataDecoded: null,
      to: { value: generateChecksummedAddress() },
      value: '0',
      operation: 0,
      addressInfoIndex: null,
      trustedDelegateCallTarget: null,
    },
    detailedExecutionInfo: {
      type: 'MULTISIG',
      nonce: faker.number.int({ min: 0, max: 100 }),
      confirmationsRequired: 2,
      confirmationsSubmitted: 1,
      confirmations: [],
      missingSigners: null,
      baseGas: '21000',
      gasPrice: '1000000000',
      safeTxGas: '50000',
      gasToken: '0x0000000000000000000000000000000000000000',
      refundReceiver: { value: '0x0000000000000000000000000000000000000000' },
      submittedAt: Date.now(),
      safeTxHash: faker.string.hexadecimal({ length: 64 }),
      signers: [{ value: generateChecksummedAddress() }],
      rejectors: [],
      trusted: true,
    },
    txHash: null,
    safeAppInfo: null,
    ...overrides,
  }) as TransactionDetails

describe('useSafeTx', () => {
  const mockUseDefinedActiveSafe = activeSafeHook.useDefinedActiveSafe as jest.Mock
  const mockUseSafeSDK = safeCoreSDKHook.useSafeSDK as jest.Mock
  const mockExtractTxInfo = extractTxModule.default as jest.Mock
  const mockCreateExistingTx = txSenderModule.createExistingTx as jest.Mock

  const mockActiveSafe = {
    address: generateChecksummedAddress(),
    chainId: '1',
  }

  const mockTxParams: SafeTransactionData = {
    to: generateChecksummedAddress(),
    value: '0',
    data: '0x',
    operation: 0,
    safeTxGas: '0',
    baseGas: '0',
    gasPrice: '0',
    gasToken: '0x0000000000000000000000000000000000000000',
    refundReceiver: '0x0000000000000000000000000000000000000000',
    nonce: 0,
  }

  const mockSignatures = { [generateChecksummedAddress()]: '0xsignature' }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseDefinedActiveSafe.mockReturnValue(mockActiveSafe)
    mockUseSafeSDK.mockReturnValue(undefined)
    mockExtractTxInfo.mockReturnValue({ txParams: mockTxParams, signatures: mockSignatures })
    mockCreateExistingTx.mockResolvedValue(createMockSafeTx())
  })

  describe('initial state', () => {
    it('returns undefined when txDetails is undefined', () => {
      mockUseSafeSDK.mockReturnValue({} as Safe)

      const { result } = renderHook(() => useSafeTx(undefined))

      expect(result.current).toBeUndefined()
      expect(mockExtractTxInfo).not.toHaveBeenCalled()
      expect(mockCreateExistingTx).not.toHaveBeenCalled()
    })

    it('returns undefined when safeSDK is undefined', () => {
      mockUseSafeSDK.mockReturnValue(undefined)
      const txDetails = createMockTxDetails()

      const { result } = renderHook(() => useSafeTx(txDetails))

      expect(result.current).toBeUndefined()
      expect(mockExtractTxInfo).not.toHaveBeenCalled()
      expect(mockCreateExistingTx).not.toHaveBeenCalled()
    })

    it('returns undefined when both txDetails and safeSDK are undefined', () => {
      mockUseSafeSDK.mockReturnValue(undefined)

      const { result } = renderHook(() => useSafeTx(undefined))

      expect(result.current).toBeUndefined()
      expect(mockExtractTxInfo).not.toHaveBeenCalled()
      expect(mockCreateExistingTx).not.toHaveBeenCalled()
    })
  })

  describe('successful transaction creation', () => {
    it('creates safeTx when txDetails and safeSDK are available', async () => {
      const mockSafeSDK = {} as Safe
      const txDetails = createMockTxDetails()
      const expectedSafeTx = createMockSafeTx()

      mockUseSafeSDK.mockReturnValue(mockSafeSDK)
      mockCreateExistingTx.mockResolvedValue(expectedSafeTx)

      const { result } = renderHook(() => useSafeTx(txDetails))

      await waitFor(() => {
        expect(result.current).toBe(expectedSafeTx)
      })

      expect(mockExtractTxInfo).toHaveBeenCalledWith(txDetails, mockActiveSafe.address)
      expect(mockCreateExistingTx).toHaveBeenCalledWith(mockTxParams, mockSignatures)
    })

    it('extracts tx info with correct safe address', async () => {
      const customSafeAddress = generateChecksummedAddress()
      mockUseDefinedActiveSafe.mockReturnValue({ ...mockActiveSafe, address: customSafeAddress })
      mockUseSafeSDK.mockReturnValue({} as Safe)

      const txDetails = createMockTxDetails()

      renderHook(() => useSafeTx(txDetails))

      await waitFor(() => {
        expect(mockExtractTxInfo).toHaveBeenCalledWith(txDetails, customSafeAddress)
      })
    })
  })

  describe('error handling', () => {
    it('returns undefined when createExistingTx throws an error', async () => {
      const mockSafeSDK = {} as Safe
      const txDetails = createMockTxDetails()
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      mockUseSafeSDK.mockReturnValue(mockSafeSDK)
      mockCreateExistingTx.mockRejectedValue(new Error('SDK initialization failed'))

      const { result } = renderHook(() => useSafeTx(txDetails))

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to create safe tx', expect.any(Error))
      })

      expect(result.current).toBeUndefined()
      consoleErrorSpy.mockRestore()
    })

    it('returns undefined when extractTxInfo throws an error', async () => {
      const mockSafeSDK = {} as Safe
      const txDetails = createMockTxDetails()
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      mockUseSafeSDK.mockReturnValue(mockSafeSDK)
      mockExtractTxInfo.mockImplementation(() => {
        throw new Error('Invalid transaction details')
      })

      const { result } = renderHook(() => useSafeTx(txDetails))

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to create safe tx', expect.any(Error))
      })

      expect(result.current).toBeUndefined()
      consoleErrorSpy.mockRestore()
    })
  })

  describe('reactivity', () => {
    it('re-creates safeTx when txDetails changes', async () => {
      const mockSafeSDK = {} as Safe
      const txDetails1 = createMockTxDetails({ txId: 'tx-1' })
      const txDetails2 = createMockTxDetails({ txId: 'tx-2' })
      const safeTx1 = createMockSafeTx({ nonce: 1 })
      const safeTx2 = createMockSafeTx({ nonce: 2 })

      mockUseSafeSDK.mockReturnValue(mockSafeSDK)
      mockCreateExistingTx.mockResolvedValueOnce(safeTx1).mockResolvedValueOnce(safeTx2)

      const { result, rerender } = renderHook(({ txDetails }) => useSafeTx(txDetails), {
        initialProps: { txDetails: txDetails1 },
      })

      await waitFor(() => {
        expect(result.current).toBe(safeTx1)
      })

      rerender({ txDetails: txDetails2 })

      await waitFor(() => {
        expect(result.current).toBe(safeTx2)
      })

      expect(mockCreateExistingTx).toHaveBeenCalledTimes(2)
    })

    it('re-creates safeTx when safeSDK becomes available', async () => {
      const txDetails = createMockTxDetails()
      const expectedSafeTx = createMockSafeTx()

      mockUseSafeSDK.mockReturnValue(undefined)
      mockCreateExistingTx.mockResolvedValue(expectedSafeTx)

      const { result, rerender } = renderHook(() => useSafeTx(txDetails))

      expect(result.current).toBeUndefined()
      expect(mockCreateExistingTx).not.toHaveBeenCalled()

      mockUseSafeSDK.mockReturnValue({} as Safe)
      rerender({})

      await waitFor(() => {
        expect(result.current).toBe(expectedSafeTx)
      })

      expect(mockCreateExistingTx).toHaveBeenCalledTimes(1)
    })

    it('resets safeTx to undefined when safeSDK becomes unavailable', async () => {
      const mockSafeSDK = {} as Safe
      const txDetails = createMockTxDetails()
      const expectedSafeTx = createMockSafeTx()

      mockUseSafeSDK.mockReturnValue(mockSafeSDK)
      mockCreateExistingTx.mockResolvedValue(expectedSafeTx)

      const { result, rerender } = renderHook(() => useSafeTx(txDetails))

      await waitFor(() => {
        expect(result.current).toBe(expectedSafeTx)
      })

      mockUseSafeSDK.mockReturnValue(undefined)
      rerender({})

      await waitFor(() => {
        expect(result.current).toBeUndefined()
      })
    })

    it('resets safeTx to undefined when txDetails becomes undefined', async () => {
      const mockSafeSDK = {} as Safe
      const txDetails = createMockTxDetails()
      const expectedSafeTx = createMockSafeTx()

      mockUseSafeSDK.mockReturnValue(mockSafeSDK)
      mockCreateExistingTx.mockResolvedValue(expectedSafeTx)

      const { result, rerender } = renderHook(({ details }) => useSafeTx(details), {
        initialProps: { details: txDetails as TransactionDetails | undefined },
      })

      await waitFor(() => {
        expect(result.current).toBe(expectedSafeTx)
      })

      rerender({ details: undefined })

      await waitFor(() => {
        expect(result.current).toBeUndefined()
      })
    })
  })
})
