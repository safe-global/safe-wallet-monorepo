import { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { Address, SafeInfo } from '@/src/types/address'
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
jest.mock('@safe-global/protocol-kit', () => ({
  ...jest.requireActual('@safe-global/protocol-kit'),
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

const fakeAddress = () => faker.finance.ethereumAddress() as Address

const VALID_TX_HASH = faker.string.hexadecimal({ length: 64, prefix: '0x' })

const safeAddress = fakeAddress()
const mockChain = { chainId: '1' } as Chain
const mockActiveSafe: SafeInfo = { address: safeAddress, chainId: '1' }

const createMockProvider = (txHash = VALID_TX_HASH): Provider =>
  ({
    request: jest.fn().mockResolvedValue(txHash),
  }) as unknown as Provider

const createMockSDK = (threshold = 1, owners = [fakeAddress()], approvedOwners: string[] = []) => ({
  getThreshold: jest.fn().mockResolvedValue(threshold),
  getOwners: jest.fn().mockResolvedValue(owners),
  getTransactionHash: jest.fn().mockResolvedValue(faker.string.hexadecimal({ length: 64, prefix: '0x' })),
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
  const signerAddress = fakeAddress()
  const otherSigner = fakeAddress()

  beforeEach(() => {
    jest.clearAllMocks()
    mockExtractTxInfo.mockReturnValue({
      txParams: { to: fakeAddress(), value: '0', data: '0x' },
      signatures: { [otherSigner]: '0xSig' },
    })
    mockGetUserNonce.mockResolvedValue(5)
  })

  it('should execute a transaction via WalletConnect provider', async () => {
    const mockProvider = createMockProvider()
    const mockSDK = createMockSDK(1, [signerAddress])
    const mockSafeTx = createMockSafeTx([otherSigner])

    mockGetSafeSDK.mockReturnValue(mockSDK)
    mockFetchTransactionDetails.mockResolvedValue({ detailedExecutionInfo: {} })
    mockCreateExistingTx.mockResolvedValue(mockSafeTx)

    const result = await executeWalletConnectTx({
      chain: mockChain,
      activeSafe: mockActiveSafe,
      txId: 'tx123',
      signerAddress,
      provider: mockProvider,
    })

    expect(mockProvider.request).toHaveBeenCalledWith({
      method: 'eth_sendTransaction',
      params: [
        {
          from: signerAddress,
          to: safeAddress,
          data: '0xEncodedData',
        },
      ],
    })

    expect(result).toEqual({
      type: ExecutionMethod.WITH_WC,
      txId: 'tx123',
      chainId: '1',
      safeAddress,
      txHash: VALID_TX_HASH,
      walletAddress: signerAddress,
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
        signerAddress,
        provider: createMockProvider(),
      }),
    ).rejects.toThrow('Safe SDK not initialized')
  })

  it('should not add duplicate pre-validated signature when signer already approved on-chain', async () => {
    const mockProvider = createMockProvider()
    const mockSDK = createMockSDK(1, [signerAddress], [signerAddress])
    const mockSafeTx = createMockSafeTx()

    mockGetSafeSDK.mockReturnValue(mockSDK)
    mockFetchTransactionDetails.mockResolvedValue({ detailedExecutionInfo: {} })
    mockCreateExistingTx.mockResolvedValue(mockSafeTx)

    await executeWalletConnectTx({
      chain: mockChain,
      activeSafe: mockActiveSafe,
      txId: 'tx123',
      signerAddress,
      provider: mockProvider,
    })

    // addSignature should be called once (from ownersWhoApprovedTx), not twice
    expect(mockSafeTx.addSignature).toHaveBeenCalledTimes(1)
  })

  it('should throw when threshold is not met', async () => {
    const mockSDK = createMockSDK(3, [signerAddress], [])
    const mockSafeTx = createMockSafeTx()

    mockGetSafeSDK.mockReturnValue(mockSDK)
    mockFetchTransactionDetails.mockResolvedValue({ detailedExecutionInfo: {} })
    mockCreateExistingTx.mockResolvedValue(mockSafeTx)

    await expect(
      executeWalletConnectTx({
        chain: mockChain,
        activeSafe: mockActiveSafe,
        txId: 'tx123',
        signerAddress,
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

    const mockSDK = createMockSDK(1, [signerAddress])
    const mockSafeTx = createMockSafeTx([otherSigner])

    mockGetSafeSDK.mockReturnValue(mockSDK)
    mockFetchTransactionDetails.mockResolvedValue({ detailedExecutionInfo: {} })
    mockCreateExistingTx.mockResolvedValue(mockSafeTx)

    await executeWalletConnectTx({
      chain: mockChain,
      activeSafe: mockActiveSafe,
      txId: 'tx123',
      signerAddress,
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

    const mockSDK = createMockSDK(1, [signerAddress])
    const mockSafeTx = createMockSafeTx([otherSigner])

    mockGetSafeSDK.mockReturnValue(mockSDK)
    mockFetchTransactionDetails.mockResolvedValue({ detailedExecutionInfo: {} })
    mockCreateExistingTx.mockResolvedValue(mockSafeTx)

    await expect(
      executeWalletConnectTx({
        chain: mockChain,
        activeSafe: mockActiveSafe,
        txId: 'tx123',
        signerAddress,
        provider: mockProvider,
      }),
    ).rejects.toThrow('invalid transaction hash')
  })

  it('should handle provider rejection', async () => {
    const mockProvider = {
      request: jest.fn().mockRejectedValue(new Error('User rejected')),
    } as unknown as Provider

    const mockSDK = createMockSDK(1, [signerAddress])
    const mockSafeTx = createMockSafeTx([otherSigner])

    mockGetSafeSDK.mockReturnValue(mockSDK)
    mockFetchTransactionDetails.mockResolvedValue({ detailedExecutionInfo: {} })
    mockCreateExistingTx.mockResolvedValue(mockSafeTx)

    await expect(
      executeWalletConnectTx({
        chain: mockChain,
        activeSafe: mockActiveSafe,
        txId: 'tx123',
        signerAddress,
        provider: mockProvider,
      }),
    ).rejects.toThrow('User rejected')
  })

  it('should add pre-validated signatures for on-chain approvers', async () => {
    const owner1 = fakeAddress()
    const owner2 = fakeAddress()
    const mockProvider = createMockProvider()
    const mockSDK = createMockSDK(2, [owner1, owner2], [owner1])
    const mockSafeTx = createMockSafeTx([owner2])

    mockGetSafeSDK.mockReturnValue(mockSDK)
    mockFetchTransactionDetails.mockResolvedValue({ detailedExecutionInfo: {} })
    mockCreateExistingTx.mockResolvedValue(mockSafeTx)

    await executeWalletConnectTx({
      chain: mockChain,
      activeSafe: mockActiveSafe,
      txId: 'tx123',
      signerAddress: owner2,
      provider: mockProvider,
    })

    expect(mockSafeTx.addSignature).toHaveBeenCalledWith(expect.objectContaining({ signer: owner1 }))
    expect(mockSafeTx.signatures.size).toBe(2)
  })

  it('should add pre-validated signatures for multiple on-chain approvers', async () => {
    const ownerA = fakeAddress()
    const ownerB = fakeAddress()
    const ownerC = fakeAddress()
    const mockProvider = createMockProvider()
    const mockSDK = createMockSDK(3, [ownerA, ownerB, ownerC], [ownerA, ownerB])
    const mockSafeTx = createMockSafeTx()

    mockGetSafeSDK.mockReturnValue(mockSDK)
    mockFetchTransactionDetails.mockResolvedValue({ detailedExecutionInfo: {} })
    mockCreateExistingTx.mockResolvedValue(mockSafeTx)

    await executeWalletConnectTx({
      chain: mockChain,
      activeSafe: mockActiveSafe,
      txId: 'tx123',
      signerAddress: ownerC,
      provider: mockProvider,
    })

    // 2 on-chain approvers + 1 executor
    expect(mockSafeTx.signatures.size).toBe(3)
  })

  it('should match signer address case-insensitively', async () => {
    const upperCaseOwner = fakeAddress().toUpperCase().replace('0X', '0x') as Address
    const lowerCaseSigner = upperCaseOwner.toLowerCase() as Address
    const mockProvider = createMockProvider()
    const mockSDK = createMockSDK(1, [upperCaseOwner], [])
    const mockSafeTx = createMockSafeTx()

    mockGetSafeSDK.mockReturnValue(mockSDK)
    mockFetchTransactionDetails.mockResolvedValue({ detailedExecutionInfo: {} })
    mockCreateExistingTx.mockResolvedValue(mockSafeTx)

    await executeWalletConnectTx({
      chain: mockChain,
      activeSafe: mockActiveSafe,
      txId: 'tx123',
      signerAddress: lowerCaseSigner,
      provider: mockProvider,
    })

    expect(mockSafeTx.addSignature).toHaveBeenCalledWith(expect.objectContaining({ signer: lowerCaseSigner }))
  })

  it('should not add pre-validated signature for non-owner executor', async () => {
    const owner = fakeAddress()
    const nonOwner = fakeAddress()
    const mockProvider = createMockProvider()
    // threshold=1, one existing signature meets it, executor is not an owner
    const mockSDK = createMockSDK(1, [owner], [])
    const mockSafeTx = createMockSafeTx([owner])

    mockGetSafeSDK.mockReturnValue(mockSDK)
    mockFetchTransactionDetails.mockResolvedValue({ detailedExecutionInfo: {} })
    mockCreateExistingTx.mockResolvedValue(mockSafeTx)

    await executeWalletConnectTx({
      chain: mockChain,
      activeSafe: mockActiveSafe,
      txId: 'tx123',
      signerAddress: nonOwner,
      provider: mockProvider,
    })

    expect(mockSafeTx.addSignature).not.toHaveBeenCalled()
  })

  it('should not add executor signature when threshold already met', async () => {
    const owner1 = fakeAddress()
    const owner2 = fakeAddress()
    const mockProvider = createMockProvider()
    const mockSDK = createMockSDK(2, [owner1, owner2], [])
    const mockSafeTx = createMockSafeTx([owner1, owner2])

    mockGetSafeSDK.mockReturnValue(mockSDK)
    mockFetchTransactionDetails.mockResolvedValue({ detailedExecutionInfo: {} })
    mockCreateExistingTx.mockResolvedValue(mockSafeTx)

    await executeWalletConnectTx({
      chain: mockChain,
      activeSafe: mockActiveSafe,
      txId: 'tx123',
      signerAddress: owner1,
      provider: mockProvider,
    })

    expect(mockSafeTx.addSignature).not.toHaveBeenCalled()
  })

  it('should use singular form when 1 signature is missing', async () => {
    const owner = fakeAddress()
    const mockSDK = createMockSDK(2, [owner], [])
    const mockSafeTx = createMockSafeTx()

    mockGetSafeSDK.mockReturnValue(mockSDK)
    mockFetchTransactionDetails.mockResolvedValue({ detailedExecutionInfo: {} })
    mockCreateExistingTx.mockResolvedValue(mockSafeTx)

    await expect(
      executeWalletConnectTx({
        chain: mockChain,
        activeSafe: mockActiveSafe,
        txId: 'tx123',
        signerAddress: owner,
        provider: createMockProvider(),
      }),
    ).rejects.toThrow('1 more signature')
  })

  it('should use plural form when multiple signatures are missing', async () => {
    const owner = fakeAddress()
    const mockSDK = createMockSDK(3, [owner], [])
    const mockSafeTx = createMockSafeTx()

    mockGetSafeSDK.mockReturnValue(mockSDK)
    mockFetchTransactionDetails.mockResolvedValue({ detailedExecutionInfo: {} })
    mockCreateExistingTx.mockResolvedValue(mockSafeTx)

    await expect(
      executeWalletConnectTx({
        chain: mockChain,
        activeSafe: mockActiveSafe,
        txId: 'tx123',
        signerAddress: owner,
        provider: createMockProvider(),
      }),
    ).rejects.toThrow('2 more signatures')
  })

  it('should pass correct arguments to dependencies', async () => {
    const mockProvider = createMockProvider()
    const mockSDK = createMockSDK(1, [signerAddress])
    const mockSafeTx = createMockSafeTx([otherSigner])
    const txDetails = { detailedExecutionInfo: { type: 'MULTISIG' } }
    const txParams = { to: fakeAddress(), value: '0', data: '0x' }
    const signatures = { [otherSigner]: '0xSig' }

    mockGetSafeSDK.mockReturnValue(mockSDK)
    mockFetchTransactionDetails.mockResolvedValue(txDetails)
    mockExtractTxInfo.mockReturnValue({ txParams, signatures })
    mockCreateExistingTx.mockResolvedValue(mockSafeTx)

    await executeWalletConnectTx({
      chain: mockChain,
      activeSafe: mockActiveSafe,
      txId: 'tx123',
      signerAddress,
      provider: mockProvider,
    })

    expect(mockFetchTransactionDetails).toHaveBeenCalledWith('1', 'tx123')
    expect(mockExtractTxInfo).toHaveBeenCalledWith(txDetails, safeAddress)
    expect(mockCreateExistingTx).toHaveBeenCalledWith(txParams, signatures)
    expect(mockGetUserNonce).toHaveBeenCalledWith(mockChain, signerAddress)
  })
})
