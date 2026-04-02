import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { SafeVersion } from '@safe-global/types-kit'
import type { SafeInfo } from '@/src/types/address'
import type { Provider } from '@reown/appkit-common-react-native'
import { signWithWalletConnect } from './walletconnect-signing.service'
import { SigningMethod } from '@safe-global/protocol-kit'

const mockFetchTransactionDetails = jest.fn()
const mockExtractTxInfo = jest.fn()
const mockCreateExistingTx = jest.fn()
const mockGenerateTypedData = jest.fn()
const mockTypedDataEncoderHash = jest.fn()
const mockLoggerInfo = jest.fn()
const mockLoggerWarn = jest.fn()

jest.mock('../tx/fetchTransactionDetails', () => ({
  fetchTransactionDetails: (...args: unknown[]) => mockFetchTransactionDetails(...args),
}))

jest.mock('../tx/extractTx', () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockExtractTxInfo(...args),
}))

jest.mock('../tx/tx-sender/create', () => ({
  createExistingTx: (...args: unknown[]) => mockCreateExistingTx(...args),
}))

jest.mock('@safe-global/protocol-kit/dist/src/utils/eip-712', () => ({
  generateTypedData: (...args: unknown[]) => mockGenerateTypedData(...args),
}))

jest.mock('ethers', () => ({
  TypedDataEncoder: {
    hash: (...args: unknown[]) => mockTypedDataEncoderHash(...args),
  },
}))

jest.mock('@/src/utils/logger', () => ({
  __esModule: true,
  default: {
    info: (...args: unknown[]) => mockLoggerInfo(...args),
    warn: (...args: unknown[]) => mockLoggerWarn(...args),
  },
}))

describe('signWithWalletConnect', () => {
  const mockChain: Chain = {
    chainId: '1',
    chainName: 'Ethereum',
  } as Chain

  const mockActiveSafe: SafeInfo = {
    address: '0xSafeAddress',
    chainId: '1',
  }

  const mockTxParams = {
    to: '0xRecipient',
    value: '1000000000000000000',
    data: '0x',
    nonce: 1,
  }

  const mockSignatures = {
    '0xOwner1': '0xSignature1',
  }

  const mockSafeTx = {
    data: mockTxParams,
  }

  const mockTypedData = {
    domain: {
      verifyingContract: '0xSafeAddress',
      chainId: 1,
    },
    types: {
      EIP712Domain: [{ name: 'verifyingContract', type: 'address' }],
      SafeTx: [{ name: 'to', type: 'address' }],
    },
    primaryType: 'SafeTx',
    message: { to: '0xRecipient' },
  }

  const mockProvider = {
    request: jest.fn(),
  } as unknown as Provider & { request: jest.Mock }

  const defaultParams = {
    chain: mockChain,
    activeSafe: mockActiveSafe,
    txId: 'tx123',
    signerAddress: '0xSignerAddress',
    safeVersion: '1.3.0' as SafeVersion,
    provider: mockProvider,
  }

  beforeEach(() => {
    jest.clearAllMocks()

    mockFetchTransactionDetails.mockResolvedValue({ id: 'tx123' })
    mockExtractTxInfo.mockReturnValue({ txParams: mockTxParams, signatures: mockSignatures })
    mockCreateExistingTx.mockResolvedValue(mockSafeTx)
    mockGenerateTypedData.mockReturnValue(mockTypedData)
    mockTypedDataEncoderHash.mockReturnValue('0xSafeTransactionHash')
    mockProvider.request.mockResolvedValue('0x' + 'a'.repeat(130))
  })

  it('returns signature and safeTransactionHash on success', async () => {
    const result = await signWithWalletConnect(defaultParams)

    expect(result).toEqual({
      signature: '0x' + 'a'.repeat(130),
      safeTransactionHash: '0xSafeTransactionHash',
    })
  })

  it('fetches transaction details with chainId and txId', async () => {
    await signWithWalletConnect(defaultParams)

    expect(mockFetchTransactionDetails).toHaveBeenCalledWith('1', 'tx123')
  })

  it('extracts tx info from fetched details', async () => {
    const txDetails = { id: 'tx123' }
    mockFetchTransactionDetails.mockResolvedValue(txDetails)

    await signWithWalletConnect(defaultParams)

    expect(mockExtractTxInfo).toHaveBeenCalledWith(txDetails, '0xSafeAddress')
  })

  it('creates existing tx with extracted params and signatures', async () => {
    await signWithWalletConnect(defaultParams)

    expect(mockCreateExistingTx).toHaveBeenCalledWith(mockTxParams, mockSignatures)
  })

  it('generates typed data with correct params', async () => {
    await signWithWalletConnect(defaultParams)

    expect(mockGenerateTypedData).toHaveBeenCalledWith({
      safeAddress: '0xSafeAddress',
      safeVersion: '1.3.0',
      chainId: BigInt(1),
      data: mockTxParams,
    })
  })

  it('computes safeTransactionHash without EIP712Domain type', async () => {
    await signWithWalletConnect(defaultParams)

    const [domain, types] = mockTypedDataEncoderHash.mock.calls[0]

    expect(domain).toEqual(mockTypedData.domain)
    expect(types).not.toHaveProperty('EIP712Domain')
    expect(types).toHaveProperty('SafeTx')
  })

  it('calls provider.request with eth_signTypedData_v4', async () => {
    await signWithWalletConnect(defaultParams)

    expect(mockProvider.request).toHaveBeenCalledWith({
      method: SigningMethod.ETH_SIGN_TYPED_DATA_V4,
      params: ['0xSignerAddress', JSON.stringify(mockTypedData)],
    })
  })

  it('throws when provider returns non-string signature', async () => {
    mockProvider.request.mockResolvedValue(42)

    await expect(signWithWalletConnect(defaultParams)).rejects.toThrow('Invalid signature received from wallet')
  })

  it('throws when provider returns null', async () => {
    mockProvider.request.mockResolvedValue(null)

    await expect(signWithWalletConnect(defaultParams)).rejects.toThrow('Invalid signature received from wallet')
  })

  it('propagates fetchTransactionDetails errors', async () => {
    mockFetchTransactionDetails.mockRejectedValue(new Error('Network error'))

    await expect(signWithWalletConnect(defaultParams)).rejects.toThrow('Network error')
  })

  it('propagates provider.request errors', async () => {
    mockProvider.request.mockRejectedValue(new Error('User rejected'))

    await expect(signWithWalletConnect(defaultParams)).rejects.toThrow('User rejected')
  })

  it('logs success info with signing details', async () => {
    await signWithWalletConnect(defaultParams)

    expect(mockLoggerInfo).toHaveBeenCalledWith('Successfully signed transaction via WalletConnect', {
      signerAddress: '0xSignerAddress',
      safeTransactionHash: '0xSafeTransactionHash',
      txId: 'tx123',
    })
  })
})
