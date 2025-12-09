import { executeTx } from './execute'
import { proposeTx, addSignaturesToTx } from './create'
import { createConnectedWallet } from '@/src/services/web3'
import type { SafeInfo } from '@/src/types/address'
import type { EstimatedFeeValues } from '@/src/store/estimatedFeeSlice'
import {
  generateChecksummedAddress,
  generatePrivateKey,
  generateTxId,
  createMockSafeTx,
  createMockChain,
  createMockSafeInfo,
  createMockProtocolKit,
} from '@safe-global/test'

jest.mock('./create')
jest.mock('@/src/services/web3')

describe('executeTx', () => {
  const mockChain = createMockChain()
  const mockActiveSafe: SafeInfo = createMockSafeInfo()
  const mockPrivateKey = generatePrivateKey()
  const mockTxId = generateTxId()

  const mockProtocolKit = createMockProtocolKit()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createConnectedWallet as jest.Mock).mockResolvedValue({
      wallet: { address: generateChecksummedAddress() },
      protocolKit: mockProtocolKit,
    })
  })

  it('throws error when chain is not provided', async () => {
    await expect(
      executeTx({
        chain: undefined as never,
        activeSafe: mockActiveSafe,
        txId: mockTxId,
        privateKey: mockPrivateKey,
        feeParams: null,
      }),
    ).rejects.toThrow('Active chain not found')
  })

  it('throws error when private key is not provided', async () => {
    await expect(
      executeTx({
        chain: mockChain,
        activeSafe: mockActiveSafe,
        txId: mockTxId,
        privateKey: '',
        feeParams: null,
      }),
    ).rejects.toThrow('Private key not found')
  })

  it('throws error when safeTx is not found', async () => {
    const mockSignatures = {}
    ;(proposeTx as jest.Mock).mockResolvedValue({ safeTx: null, signatures: mockSignatures })

    await expect(
      executeTx({
        chain: mockChain,
        activeSafe: mockActiveSafe,
        txId: mockTxId,
        privateKey: mockPrivateKey,
        feeParams: null,
      }),
    ).rejects.toThrow('Safe transaction not found')
  })

  it('executes transaction without fee params', async () => {
    const mockTx = createMockSafeTx()
    const signer = generateChecksummedAddress()
    const mockSignatures = { [signer]: '0xsignature' }
    const mockExecuteResult = { hash: '0xtxhash' }

    ;(proposeTx as jest.Mock).mockResolvedValue({ safeTx: mockTx, signatures: mockSignatures })
    mockProtocolKit.executeTransaction.mockResolvedValue(mockExecuteResult)

    const result = await executeTx({
      chain: mockChain,
      activeSafe: mockActiveSafe,
      txId: mockTxId,
      privateKey: mockPrivateKey,
      feeParams: null,
    })

    expect(addSignaturesToTx).toHaveBeenCalledWith(mockTx, mockSignatures)
    expect(mockProtocolKit.executeTransaction).toHaveBeenCalledWith(mockTx, undefined)
    expect(result).toBe(mockExecuteResult)
  })

  it('executes transaction with fee params', async () => {
    const mockTx = createMockSafeTx()
    const mockSignatures = {}
    const mockExecuteResult = { hash: '0xtxhash' }
    const feeParams: EstimatedFeeValues = {
      gasLimit: BigInt(100000),
      maxFeePerGas: BigInt(20000000000),
      maxPriorityFeePerGas: BigInt(1500000000),
      nonce: 10,
    }

    ;(proposeTx as jest.Mock).mockResolvedValue({ safeTx: mockTx, signatures: mockSignatures })
    mockProtocolKit.executeTransaction.mockResolvedValue(mockExecuteResult)

    const result = await executeTx({
      chain: mockChain,
      activeSafe: mockActiveSafe,
      txId: mockTxId,
      privateKey: mockPrivateKey,
      feeParams,
    })

    expect(mockProtocolKit.executeTransaction).toHaveBeenCalledWith(mockTx, {
      gasLimit: '100000',
      maxFeePerGas: '20000000000',
      maxPriorityFeePerGas: '1500000000',
      nonce: 10,
    })
    expect(result).toBe(mockExecuteResult)
  })

  it('calls proposeTx with correct parameters', async () => {
    const mockTx = createMockSafeTx()
    ;(proposeTx as jest.Mock).mockResolvedValue({ safeTx: mockTx, signatures: {} })
    mockProtocolKit.executeTransaction.mockResolvedValue({ hash: '0x' })

    await executeTx({
      chain: mockChain,
      activeSafe: mockActiveSafe,
      txId: mockTxId,
      privateKey: mockPrivateKey,
      feeParams: null,
    })

    expect(proposeTx).toHaveBeenCalledWith({
      activeSafe: mockActiveSafe,
      txId: mockTxId,
      chain: mockChain,
      privateKey: mockPrivateKey,
    })
  })

  it('creates connected wallet before execution', async () => {
    const mockTx = createMockSafeTx()
    ;(proposeTx as jest.Mock).mockResolvedValue({ safeTx: mockTx, signatures: {} })
    mockProtocolKit.executeTransaction.mockResolvedValue({ hash: '0x' })

    await executeTx({
      chain: mockChain,
      activeSafe: mockActiveSafe,
      txId: mockTxId,
      privateKey: mockPrivateKey,
      feeParams: null,
    })

    expect(createConnectedWallet).toHaveBeenCalledWith(mockPrivateKey, mockActiveSafe, mockChain)
  })
})
