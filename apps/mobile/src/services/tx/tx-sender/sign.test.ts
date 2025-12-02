import { signTx } from './sign'
import { proposeTx } from './create'
import { createConnectedWallet } from '@/src/services/web3'
import type { SafeInfo } from '@/src/types/address'
import { SigningMethod } from '@safe-global/protocol-kit'
import {
  generateChecksummedAddress,
  generateSignature,
  generateSafeTxHash,
  generatePrivateKey,
  generateTxId,
  createMockSafeTxWithSigner,
  createMockChain,
  createMockSafeInfo,
  createMockProtocolKit,
} from '@safe-global/test'

jest.mock('./create')
jest.mock('@/src/services/web3')

describe('signTx', () => {
  const mockChain = createMockChain()
  const mockActiveSafe: SafeInfo = createMockSafeInfo()
  const mockPrivateKey = generatePrivateKey()
  const mockTxId = generateTxId()
  const mockWalletAddress = generateChecksummedAddress()
  const mockSignature = generateSignature()
  const mockSafeTxHash = generateSafeTxHash()

  const mockProtocolKit = createMockProtocolKit()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createConnectedWallet as jest.Mock).mockResolvedValue({
      wallet: { address: mockWalletAddress },
      protocolKit: mockProtocolKit,
    })
  })

  it('throws error when chain is not provided', async () => {
    await expect(
      signTx({
        chain: undefined as never,
        activeSafe: mockActiveSafe,
        txId: mockTxId,
        privateKey: mockPrivateKey,
      }),
    ).rejects.toThrow('Active chain not found')
  })

  it('throws error when private key is not provided', async () => {
    await expect(
      signTx({
        chain: mockChain,
        activeSafe: mockActiveSafe,
        txId: mockTxId,
        privateKey: undefined,
      }),
    ).rejects.toThrow('Private key not found')
  })

  it('throws error when safeTx is not found', async () => {
    ;(proposeTx as jest.Mock).mockResolvedValue({ safeTx: null, signatures: {} })

    await expect(
      signTx({
        chain: mockChain,
        activeSafe: mockActiveSafe,
        txId: mockTxId,
        privateKey: mockPrivateKey,
      }),
    ).rejects.toThrow('Safe transaction not found')
  })

  it('throws error when signature is not found after signing', async () => {
    const mockTx = createMockSafeTxWithSigner('different-address', mockSignature)
    const mockSignedTx = createMockSafeTxWithSigner('different-address', mockSignature)
    mockSignedTx.getSignature = jest.fn().mockReturnValue(undefined)
    ;(proposeTx as jest.Mock).mockResolvedValue({ safeTx: mockTx, signatures: {} })
    mockProtocolKit.signTransaction.mockResolvedValue(mockSignedTx)
    mockProtocolKit.getTransactionHash.mockResolvedValue(mockSafeTxHash)

    await expect(
      signTx({
        chain: mockChain,
        activeSafe: mockActiveSafe,
        txId: mockTxId,
        privateKey: mockPrivateKey,
      }),
    ).rejects.toThrow('Signature not found')
  })

  it('signs transaction and returns signature with hash', async () => {
    const mockTx = createMockSafeTxWithSigner(mockWalletAddress, '')
    const mockSignedTx = createMockSafeTxWithSigner(mockWalletAddress, mockSignature)

    ;(proposeTx as jest.Mock).mockResolvedValue({ safeTx: mockTx, signatures: {} })
    mockProtocolKit.signTransaction.mockResolvedValue(mockSignedTx)
    mockProtocolKit.getTransactionHash.mockResolvedValue(mockSafeTxHash)

    const result = await signTx({
      chain: mockChain,
      activeSafe: mockActiveSafe,
      txId: mockTxId,
      privateKey: mockPrivateKey,
    })

    expect(result).toEqual({
      signature: mockSignature,
      safeTransactionHash: mockSafeTxHash,
    })
  })

  it('uses ETH_SIGN_TYPED_DATA_V4 signing method', async () => {
    const mockTx = createMockSafeTxWithSigner(mockWalletAddress, '')
    const mockSignedTx = createMockSafeTxWithSigner(mockWalletAddress, mockSignature)

    ;(proposeTx as jest.Mock).mockResolvedValue({ safeTx: mockTx, signatures: {} })
    mockProtocolKit.signTransaction.mockResolvedValue(mockSignedTx)
    mockProtocolKit.getTransactionHash.mockResolvedValue(mockSafeTxHash)

    await signTx({
      chain: mockChain,
      activeSafe: mockActiveSafe,
      txId: mockTxId,
      privateKey: mockPrivateKey,
    })

    expect(mockProtocolKit.signTransaction).toHaveBeenCalledWith(mockTx, SigningMethod.ETH_SIGN_TYPED_DATA_V4)
  })

  it('gets signature for wallet address', async () => {
    const mockTx = createMockSafeTxWithSigner(mockWalletAddress, '')
    const mockSignedTx = createMockSafeTxWithSigner(mockWalletAddress, mockSignature)

    ;(proposeTx as jest.Mock).mockResolvedValue({ safeTx: mockTx, signatures: {} })
    mockProtocolKit.signTransaction.mockResolvedValue(mockSignedTx)
    mockProtocolKit.getTransactionHash.mockResolvedValue(mockSafeTxHash)

    await signTx({
      chain: mockChain,
      activeSafe: mockActiveSafe,
      txId: mockTxId,
      privateKey: mockPrivateKey,
    })

    expect(mockSignedTx.getSignature).toHaveBeenCalledWith(mockWalletAddress)
  })

  it('creates connected wallet with correct params', async () => {
    const mockTx = createMockSafeTxWithSigner(mockWalletAddress, '')
    const mockSignedTx = createMockSafeTxWithSigner(mockWalletAddress, mockSignature)

    ;(proposeTx as jest.Mock).mockResolvedValue({ safeTx: mockTx, signatures: {} })
    mockProtocolKit.signTransaction.mockResolvedValue(mockSignedTx)
    mockProtocolKit.getTransactionHash.mockResolvedValue(mockSafeTxHash)

    await signTx({
      chain: mockChain,
      activeSafe: mockActiveSafe,
      txId: mockTxId,
      privateKey: mockPrivateKey,
    })

    expect(createConnectedWallet).toHaveBeenCalledWith(mockPrivateKey, mockActiveSafe, mockChain)
  })

  it('calls proposeTx with correct parameters', async () => {
    const mockTx = createMockSafeTxWithSigner(mockWalletAddress, '')
    const mockSignedTx = createMockSafeTxWithSigner(mockWalletAddress, mockSignature)

    ;(proposeTx as jest.Mock).mockResolvedValue({ safeTx: mockTx, signatures: {} })
    mockProtocolKit.signTransaction.mockResolvedValue(mockSignedTx)
    mockProtocolKit.getTransactionHash.mockResolvedValue(mockSafeTxHash)

    await signTx({
      chain: mockChain,
      activeSafe: mockActiveSafe,
      txId: mockTxId,
      privateKey: mockPrivateKey,
    })

    expect(proposeTx).toHaveBeenCalledWith({
      activeSafe: mockActiveSafe,
      txId: mockTxId,
      chain: mockChain,
      privateKey: mockPrivateKey,
    })
  })
})
