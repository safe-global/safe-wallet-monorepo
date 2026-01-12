import { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'
import { executeRelayTx } from './relayExecutor'
import {
  generateChecksummedAddress,
  createMockChain,
  createMockSafeInfo,
  createMockSafeState,
  createMockSafeTx,
} from '@safe-global/test'

const mockFetchTransactionDetails = jest.fn()
const mockExtractTxInfo = jest.fn()
const mockCreateTx = jest.fn()
const mockAddSignaturesToTx = jest.fn()
const mockGetReadOnlyCurrentGnosisSafeContract = jest.fn()
const mockGetLatestSafeVersion = jest.fn()

jest.mock('@/src/services/tx/fetchTransactionDetails', () => ({
  fetchTransactionDetails: (...args: unknown[]) => mockFetchTransactionDetails(...args),
}))

jest.mock('@/src/services/tx/extractTx', () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockExtractTxInfo(...args),
}))

jest.mock('@/src/services/tx/tx-sender/create', () => ({
  createTx: (...args: unknown[]) => mockCreateTx(...args),
  addSignaturesToTx: (...args: unknown[]) => mockAddSignaturesToTx(...args),
}))

jest.mock('@/src/services/contracts/safeContracts', () => ({
  getReadOnlyCurrentGnosisSafeContract: (...args: unknown[]) => mockGetReadOnlyCurrentGnosisSafeContract(...args),
}))

jest.mock('@safe-global/utils/utils/chains', () => ({
  getLatestSafeVersion: (...args: unknown[]) => mockGetLatestSafeVersion(...args),
}))

describe('executeRelayTx', () => {
  const mockChain = createMockChain()
  const mockActiveSafe = createMockSafeInfo()
  const mockSafe = createMockSafeState({
    address: mockActiveSafe.address,
    chainId: mockActiveSafe.chainId,
    nonce: 5,
    threshold: 2,
    owners: [generateChecksummedAddress()],
    version: '1.3.0',
  })

  const mockTxParams = {
    to: generateChecksummedAddress(),
    value: '1000000000000000000',
    data: '0x',
    operation: 0,
    safeTxGas: '0',
    baseGas: '0',
    gasPrice: '0',
    gasToken: '0x0000000000000000000000000000000000000000',
    refundReceiver: '0x0000000000000000000000000000000000000000',
    nonce: 5,
  }

  const mockSignatures = {
    [generateChecksummedAddress()]: '0xSignature1',
  }

  const mockSafeTx = {
    ...createMockSafeTx(),
    data: mockTxParams,
    encodedSignatures: jest.fn().mockReturnValue('0xEncodedSignatures'),
  }

  const mockEncode = jest.fn().mockReturnValue('0xEncodedExecTransaction')

  const mockRelayMutation = jest.fn()

  const defaultParams = {
    chain: mockChain,
    activeSafe: mockActiveSafe,
    safe: mockSafe,
    txId: 'tx123',
    relayMutation: mockRelayMutation,
  }

  beforeEach(() => {
    jest.clearAllMocks()

    mockFetchTransactionDetails.mockResolvedValue({ id: 'tx123' })
    mockExtractTxInfo.mockReturnValue({ txParams: mockTxParams, signatures: mockSignatures })
    mockCreateTx.mockResolvedValue(mockSafeTx)
    mockGetReadOnlyCurrentGnosisSafeContract.mockResolvedValue({ encode: mockEncode })
    mockGetLatestSafeVersion.mockReturnValue('1.4.1')
    mockRelayMutation.mockResolvedValue({ taskId: 'task456' })
  })

  describe('success cases', () => {
    it('should execute relay transaction successfully', async () => {
      const result = await executeRelayTx(defaultParams)

      expect(mockFetchTransactionDetails).toHaveBeenCalledWith('1', 'tx123')
      expect(mockExtractTxInfo).toHaveBeenCalledWith({ id: 'tx123' }, mockActiveSafe.address)
      expect(mockCreateTx).toHaveBeenCalledWith(mockTxParams, mockTxParams.nonce)
      expect(mockAddSignaturesToTx).toHaveBeenCalledWith(mockSafeTx, mockSignatures)
      expect(mockGetReadOnlyCurrentGnosisSafeContract).toHaveBeenCalledWith(mockSafe)
      expect(mockEncode).toHaveBeenCalledWith('execTransaction', [
        mockTxParams.to,
        mockTxParams.value,
        mockTxParams.data,
        mockTxParams.operation,
        mockTxParams.safeTxGas,
        mockTxParams.baseGas,
        mockTxParams.gasPrice,
        mockTxParams.gasToken,
        mockTxParams.refundReceiver,
        '0xEncodedSignatures',
      ])
      expect(mockRelayMutation).toHaveBeenCalledWith({
        chainId: '1',
        relayDto: {
          to: mockActiveSafe.address,
          data: '0xEncodedExecTransaction',
          version: '1.3.0',
        },
      })

      expect(result).toEqual({
        type: ExecutionMethod.WITH_RELAY,
        txId: 'tx123',
        taskId: 'task456',
        chainId: '1',
        safeAddress: mockActiveSafe.address,
      })
    })

    it('should use getLatestSafeVersion when safe version is null', async () => {
      const safeWithoutVersion = createMockSafeState({ version: null })

      await executeRelayTx({
        ...defaultParams,
        safe: safeWithoutVersion,
      })

      expect(mockGetLatestSafeVersion).toHaveBeenCalledWith(mockChain)
      expect(mockRelayMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          relayDto: expect.objectContaining({
            version: '1.4.1',
          }),
        }),
      )
    })

    it('should use getLatestSafeVersion when safe version is undefined', async () => {
      const safeWithoutVersion = createMockSafeState({ version: undefined })

      await executeRelayTx({
        ...defaultParams,
        safe: safeWithoutVersion,
      })

      expect(mockGetLatestSafeVersion).toHaveBeenCalledWith(mockChain)
    })
  })

  describe('error cases', () => {
    it('should throw error when createTx returns null', async () => {
      mockCreateTx.mockResolvedValue(null)

      await expect(executeRelayTx(defaultParams)).rejects.toThrow('Safe transaction not found')

      expect(mockAddSignaturesToTx).not.toHaveBeenCalled()
      expect(mockRelayMutation).not.toHaveBeenCalled()
    })

    it('should throw error when relay mutation returns no taskId', async () => {
      mockRelayMutation.mockResolvedValue({ taskId: null })

      await expect(executeRelayTx(defaultParams)).rejects.toThrow('Transaction could not be relayed')
    })

    it('should throw error when relay mutation returns undefined taskId', async () => {
      mockRelayMutation.mockResolvedValue({})

      await expect(executeRelayTx(defaultParams)).rejects.toThrow('Transaction could not be relayed')
    })

    it('should propagate error from fetchTransactionDetails', async () => {
      const fetchError = new Error('Failed to fetch transaction')
      mockFetchTransactionDetails.mockRejectedValue(fetchError)

      await expect(executeRelayTx(defaultParams)).rejects.toThrow('Failed to fetch transaction')

      expect(mockExtractTxInfo).not.toHaveBeenCalled()
    })

    it('should propagate error from createTx', async () => {
      const createError = new Error('Failed to create transaction')
      mockCreateTx.mockRejectedValue(createError)

      await expect(executeRelayTx(defaultParams)).rejects.toThrow('Failed to create transaction')

      expect(mockAddSignaturesToTx).not.toHaveBeenCalled()
    })

    it('should propagate error from getReadOnlyCurrentGnosisSafeContract', async () => {
      const contractError = new Error('Safe SDK not found.')
      mockGetReadOnlyCurrentGnosisSafeContract.mockRejectedValue(contractError)

      await expect(executeRelayTx(defaultParams)).rejects.toThrow('Safe SDK not found.')

      expect(mockRelayMutation).not.toHaveBeenCalled()
    })

    it('should propagate error from relayMutation', async () => {
      const relayError = new Error('Relay service unavailable')
      mockRelayMutation.mockRejectedValue(relayError)

      await expect(executeRelayTx(defaultParams)).rejects.toThrow('Relay service unavailable')
    })
  })

  describe('execution flow', () => {
    it('should call services in correct order', async () => {
      const callOrder: string[] = []

      mockFetchTransactionDetails.mockImplementation(async () => {
        callOrder.push('fetchTransactionDetails')
        return { id: 'tx123' }
      })
      mockExtractTxInfo.mockImplementation(() => {
        callOrder.push('extractTxInfo')
        return { txParams: mockTxParams, signatures: mockSignatures }
      })
      mockCreateTx.mockImplementation(async () => {
        callOrder.push('createTx')
        return mockSafeTx
      })
      mockAddSignaturesToTx.mockImplementation(() => {
        callOrder.push('addSignaturesToTx')
      })
      mockGetReadOnlyCurrentGnosisSafeContract.mockImplementation(async () => {
        callOrder.push('getReadOnlyCurrentGnosisSafeContract')
        return { encode: mockEncode }
      })
      mockRelayMutation.mockImplementation(async () => {
        callOrder.push('relayMutation')
        return { taskId: 'task456' }
      })

      await executeRelayTx(defaultParams)

      expect(callOrder).toEqual([
        'fetchTransactionDetails',
        'extractTxInfo',
        'createTx',
        'addSignaturesToTx',
        'getReadOnlyCurrentGnosisSafeContract',
        'relayMutation',
      ])
    })
  })
})
