import { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { SafeInfo } from '@/src/types/address'
import type { Provider } from '@reown/appkit-common-react-native'

const mockFetchTransactionDetails = jest.fn()
const mockExtractTxInfo = jest.fn()
const mockCreateExistingTx = jest.fn()
const mockGetSafeSDK = jest.fn()
const mockGetUserNonce = jest.fn()

jest.mock('@/src/services/tx/fetchTransactionDetails', () => ({
  fetchTransactionDetails: (...args: unknown[]) => mockFetchTransactionDetails(...args),
}))
jest.mock('@/src/services/tx/extractTx', () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockExtractTxInfo(...args),
}))
jest.mock('@/src/services/tx/tx-sender/create', () => ({
  createExistingTx: (...args: unknown[]) => mockCreateExistingTx(...args),
}))
jest.mock('@/src/hooks/coreSDK/safeCoreSDK', () => ({
  getSafeSDK: () => mockGetSafeSDK(),
}))
jest.mock('@/src/services/web3', () => ({
  getUserNonce: (...args: unknown[]) => mockGetUserNonce(...args),
}))
jest.mock('@safe-global/protocol-kit/dist/src/utils', () => ({
  generatePreValidatedSignature: (address: string) => ({
    signer: address,
    data: `pre-validated-${address}`,
    staticPart: () => `pre-validated-${address}`,
    dynamicPart: () => '',
    isContractSignature: false,
  }),
}))
jest.mock('@safe-global/utils/utils/addresses', () => ({
  sameAddress: (a: string, b: string) => a.toLowerCase() === b.toLowerCase(),
}))
jest.mock('@/src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}))

import { executeWalletConnectTx } from './walletConnectExecutor'
import { faker } from '@faker-js/faker'

const VALID_TX_HASH = faker.string.hexadecimal({ length: 64, prefix: '0x' })

const mockChain = { chainId: '1' } as Chain
const mockActiveSafe: SafeInfo = { address: '0xSafe', chainId: '1' }

const createMockProvider = (txHash = VALID_TX_HASH): Provider =>
  ({
    request: jest.fn().mockResolvedValue(txHash),
  }) as unknown as Provider

const createMockSDK = (threshold = 1, owners = ['0xSigner'], approvedOwners: string[] = []) => ({
  getThreshold: jest.fn().mockResolvedValue(threshold),
  getOwners: jest.fn().mockResolvedValue(owners),
  getTransactionHash: jest.fn().mockResolvedValue('0xTxHash'),
  getOwnersWhoApprovedTx: jest.fn().mockResolvedValue(approvedOwners),
  getEncodedTransaction: jest.fn().mockResolvedValue('0xEncodedData'),
})

const createMockSafeTx = (existingSignatures: string[] = []) => {
  const signatures = new Map<string, unknown>()
  existingSignatures.forEach((addr) => {
    signatures.set(addr.toLowerCase(), { signer: addr })
  })
  return {
    data: {},
    signatures,
    addSignature: jest.fn((sig: { signer: string }) => {
      signatures.set(sig.signer.toLowerCase(), sig)
    }),
  }
}

describe('executeWalletConnectTx', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockExtractTxInfo.mockReturnValue({
      txParams: { to: '0xTo', value: '0', data: '0x' },
      signatures: { '0xOtherSigner': '0xSig' },
    })
    mockGetUserNonce.mockResolvedValue(5)
  })

  it('should execute a transaction via WalletConnect provider', async () => {
    const mockProvider = createMockProvider()
    const mockSDK = createMockSDK()
    const mockSafeTx = createMockSafeTx(['0xOtherSigner'])

    mockGetSafeSDK.mockReturnValue(mockSDK)
    mockFetchTransactionDetails.mockResolvedValue({ detailedExecutionInfo: {} })
    mockCreateExistingTx.mockResolvedValue(mockSafeTx)

    const result = await executeWalletConnectTx({
      chain: mockChain,
      activeSafe: mockActiveSafe,
      txId: 'tx123',
      signerAddress: '0xSigner',
      provider: mockProvider,
    })

    expect(mockProvider.request).toHaveBeenCalledWith({
      method: 'eth_sendTransaction',
      params: [
        {
          from: '0xSigner',
          to: '0xSafe',
          data: '0xEncodedData',
        },
      ],
    })

    expect(result).toEqual({
      type: ExecutionMethod.WITH_WC,
      txId: 'tx123',
      chainId: '1',
      safeAddress: '0xSafe',
      txHash: VALID_TX_HASH,
      walletAddress: '0xSigner',
      walletNonce: 5,
    })
  })

  it('should throw when Safe SDK is not initialized', async () => {
    mockGetSafeSDK.mockReturnValue(null)

    await expect(
      executeWalletConnectTx({
        chain: mockChain,
        activeSafe: mockActiveSafe,
        txId: 'tx123',
        signerAddress: '0xSigner',
        provider: createMockProvider(),
      }),
    ).rejects.toThrow('Safe SDK not initialized')
  })

  it('should not add duplicate pre-validated signature when signer already approved on-chain', async () => {
    const mockProvider = createMockProvider()
    // Signer has already approved on-chain (returned by getOwnersWhoApprovedTx)
    const mockSDK = createMockSDK(1, ['0xSigner'], ['0xSigner'])
    const mockSafeTx = createMockSafeTx()

    mockGetSafeSDK.mockReturnValue(mockSDK)
    mockFetchTransactionDetails.mockResolvedValue({ detailedExecutionInfo: {} })
    mockCreateExistingTx.mockResolvedValue(mockSafeTx)

    await executeWalletConnectTx({
      chain: mockChain,
      activeSafe: mockActiveSafe,
      txId: 'tx123',
      signerAddress: '0xSigner',
      provider: mockProvider,
    })

    // addSignature should be called once (from ownersWhoApprovedTx), not twice
    expect(mockSafeTx.addSignature).toHaveBeenCalledTimes(1)
  })

  it('should throw when threshold is not met', async () => {
    const mockSDK = createMockSDK(3, ['0xSigner'], [])
    const mockSafeTx = createMockSafeTx()

    mockGetSafeSDK.mockReturnValue(mockSDK)
    mockFetchTransactionDetails.mockResolvedValue({ detailedExecutionInfo: {} })
    mockCreateExistingTx.mockResolvedValue(mockSafeTx)

    await expect(
      executeWalletConnectTx({
        chain: mockChain,
        activeSafe: mockActiveSafe,
        txId: 'tx123',
        signerAddress: '0xSigner',
        provider: createMockProvider(),
      }),
    ).rejects.toThrow('signature')
  })

  it('should fetch wallet nonce before sending the transaction', async () => {
    const callOrder: string[] = []
    const mockProvider = {
      request: jest.fn().mockImplementation(() => {
        callOrder.push('provider.request')
        return Promise.resolve(VALID_TX_HASH)
      }),
    } as unknown as Provider

    mockGetUserNonce.mockImplementation(() => {
      callOrder.push('getUserNonce')
      return Promise.resolve(5)
    })

    const mockSDK = createMockSDK()
    const mockSafeTx = createMockSafeTx(['0xOtherSigner'])

    mockGetSafeSDK.mockReturnValue(mockSDK)
    mockFetchTransactionDetails.mockResolvedValue({ detailedExecutionInfo: {} })
    mockCreateExistingTx.mockResolvedValue(mockSafeTx)

    await executeWalletConnectTx({
      chain: mockChain,
      activeSafe: mockActiveSafe,
      txId: 'tx123',
      signerAddress: '0xSigner',
      provider: mockProvider,
    })

    expect(callOrder).toEqual(['getUserNonce', 'provider.request'])
  })

  it.each([
    null,
    undefined,
    '',
    'not-a-hash',
    '0x123',
    '0xZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ',
  ])('should throw when provider returns invalid tx hash: %s', async (invalidHash) => {
    const mockProvider = {
      request: jest.fn().mockResolvedValue(invalidHash),
    } as unknown as Provider

    const mockSDK = createMockSDK()
    const mockSafeTx = createMockSafeTx(['0xOtherSigner'])

    mockGetSafeSDK.mockReturnValue(mockSDK)
    mockFetchTransactionDetails.mockResolvedValue({ detailedExecutionInfo: {} })
    mockCreateExistingTx.mockResolvedValue(mockSafeTx)

    await expect(
      executeWalletConnectTx({
        chain: mockChain,
        activeSafe: mockActiveSafe,
        txId: 'tx123',
        signerAddress: '0xSigner',
        provider: mockProvider,
      }),
    ).rejects.toThrow('invalid transaction hash')
  })

  it('should handle provider rejection', async () => {
    const mockProvider = {
      request: jest.fn().mockRejectedValue(new Error('User rejected')),
    } as unknown as Provider

    const mockSDK = createMockSDK()
    const mockSafeTx = createMockSafeTx(['0xOtherSigner'])

    mockGetSafeSDK.mockReturnValue(mockSDK)
    mockFetchTransactionDetails.mockResolvedValue({ detailedExecutionInfo: {} })
    mockCreateExistingTx.mockResolvedValue(mockSafeTx)

    await expect(
      executeWalletConnectTx({
        chain: mockChain,
        activeSafe: mockActiveSafe,
        txId: 'tx123',
        signerAddress: '0xSigner',
        provider: mockProvider,
      }),
    ).rejects.toThrow('User rejected')
  })
})
