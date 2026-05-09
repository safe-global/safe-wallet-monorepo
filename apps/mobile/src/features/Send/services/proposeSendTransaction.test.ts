import { proposeSendTransaction } from './proposeSendTransaction'
import { getSafeSDK } from '@/src/hooks/coreSDK/safeCoreSDK'
import { createTx } from '@/src/services/tx/tx-sender/create'
import proposeNewTransaction from '@/src/services/tx/proposeNewTransaction'
import { generateChecksummedAddress, createMockSafeTx } from '@safe-global/test'

jest.mock('@/src/hooks/coreSDK/safeCoreSDK')
jest.mock('@/src/services/tx/tx-sender/create')
jest.mock('@/src/services/tx/proposeNewTransaction')

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

describe('proposeSendTransaction', () => {
  const mockDispatch = jest.fn()

  const mockSafeSDK = {
    getChainId: jest.fn().mockResolvedValue(BigInt(1)),
    getTransactionHash: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getSafeSDK as jest.Mock).mockReturnValue(mockSafeSDK)
  })

  const defaultParams = {
    recipient: generateChecksummedAddress(),
    tokenAddress: ZERO_ADDRESS,
    amount: '1.0',
    decimals: 18,
    chainId: '1',
    safeAddress: generateChecksummedAddress(),
    sender: generateChecksummedAddress(),
    dispatch: mockDispatch,
  }

  it('builds and proposes a native token transfer without signing', async () => {
    const mockTx = createMockSafeTx()
    ;(createTx as jest.Mock).mockResolvedValue(mockTx)
    mockSafeSDK.getTransactionHash.mockResolvedValue('0xhash123')
    ;(proposeNewTransaction as jest.Mock).mockResolvedValue({
      txId: 'tx-123',
    })

    const result = await proposeSendTransaction(defaultParams)

    expect(createTx).toHaveBeenCalledWith(
      expect.objectContaining({
        value: '1000000000000000000',
        data: '0x',
      }),
      undefined,
    )
    expect(mockSafeSDK.getTransactionHash).toHaveBeenCalledWith(mockTx)
    expect(proposeNewTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        chainId: '1',
        safeTxHash: '0xhash123',
        signedTx: mockTx,
        dispatch: mockDispatch,
      }),
    )
    expect(result).toBe('tx-123')
  })

  it('builds an ERC-20 transfer with correct encoding', async () => {
    const tokenAddress = generateChecksummedAddress()
    const mockTx = createMockSafeTx()
    ;(createTx as jest.Mock).mockResolvedValue(mockTx)
    mockSafeSDK.getTransactionHash.mockResolvedValue('0xhash')
    ;(proposeNewTransaction as jest.Mock).mockResolvedValue({
      txId: 'tx-456',
    })

    await proposeSendTransaction({
      ...defaultParams,
      tokenAddress,
      amount: '100',
      decimals: 6,
    })

    expect(createTx).toHaveBeenCalledWith(
      expect.objectContaining({
        to: tokenAddress,
        value: '0',
      }),
      undefined,
    )
  })

  it('does not call signTransaction', async () => {
    const mockTx = createMockSafeTx()
    ;(createTx as jest.Mock).mockResolvedValue(mockTx)
    mockSafeSDK.getTransactionHash.mockResolvedValue('0xhash')
    ;(proposeNewTransaction as jest.Mock).mockResolvedValue({
      txId: 'tx-789',
    })

    await proposeSendTransaction(defaultParams)

    expect(mockSafeSDK).not.toHaveProperty('signTransaction')
  })

  it('throws on invalid recipient address', async () => {
    await expect(
      proposeSendTransaction({
        ...defaultParams,
        recipient: 'not-an-address',
      }),
    ).rejects.toThrow('Invalid recipient address')
  })

  it('throws on invalid token address', async () => {
    await expect(
      proposeSendTransaction({
        ...defaultParams,
        tokenAddress: 'bad-token',
      }),
    ).rejects.toThrow('Invalid token address')
  })

  it('throws when safeParseUnits returns undefined', async () => {
    await expect(
      proposeSendTransaction({
        ...defaultParams,
        amount: 'not-a-number',
      }),
    ).rejects.toThrow('Failed to parse amount')
  })

  it('throws when Safe SDK is not initialized', async () => {
    const mockTx = createMockSafeTx()
    ;(createTx as jest.Mock).mockResolvedValue(mockTx)
    ;(getSafeSDK as jest.Mock).mockReturnValue(null)

    await expect(proposeSendTransaction(defaultParams)).rejects.toThrow('Safe SDK is not initialized')
  })

  it('throws on chain mismatch', async () => {
    const mockTx = createMockSafeTx()
    ;(createTx as jest.Mock).mockResolvedValue(mockTx)
    mockSafeSDK.getChainId.mockResolvedValue(BigInt(137))

    await expect(proposeSendTransaction(defaultParams)).rejects.toThrow('Chain mismatch')
  })
})
