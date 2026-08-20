import type { JsonRpcProvider } from 'ethers'
import type Safe from '@safe-global/protocol-kit'
import type { SafeTransaction } from '@safe-global/types-kit'
import { type SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { prepareNestedApproveHashTx } from './nestedSafeTx'
import * as coreSDK from '@/hooks/coreSDK/safeCoreSDK'
import * as sdk from '@/services/tx/tx-sender/sdk'
import { MockEip1193Provider } from '@/tests/mocks/providers'

const PARENT_ADDRESS = '0x1111111111111111111111111111111111111111'
const CHILD_ADDRESS = '0x2222222222222222222222222222222222222222'
const CHILD_SAFE_TX_HASH = '0x' + 'ab'.repeat(32)
const PARENT_SAFE_TX_HASH = '0x' + 'cd'.repeat(32)
const APPROVE_HASH_DATA = '0xd4d9bdcd' + 'ab'.repeat(32)

const createParentSafe = (): SafeState =>
  ({
    chainId: '11155111',
    address: { value: PARENT_ADDRESS },
    version: '1.4.1',
    implementationVersionState: 'UP_TO_DATE',
    implementation: { value: '0x0000000000000000000000000000000000000041' },
  }) as unknown as SafeState

describe('prepareNestedApproveHashTx', () => {
  const unsignedParentTx = { signatures: new Map(), data: { to: CHILD_ADDRESS } } as unknown as SafeTransaction
  const signedParentTx = {
    signatures: new Map([[PARENT_ADDRESS.toLowerCase(), { signer: PARENT_ADDRESS }]]),
    data: { to: CHILD_ADDRESS },
  } as unknown as SafeTransaction

  const mockEncode = jest.fn(() => APPROVE_HASH_DATA)
  const mockCreateTransaction = jest.fn(() => Promise.resolve(unsignedParentTx))
  const mockGetTransactionHash = jest.fn(() => Promise.resolve(PARENT_SAFE_TX_HASH))

  const mockConnectedSdk = {
    getContractManager: () => ({ safeContract: { encode: mockEncode } }),
    createTransaction: mockCreateTransaction,
    getTransactionHash: mockGetTransactionHash,
  } as unknown as Safe

  const mockSdk = {
    connect: jest.fn(() => Promise.resolve(mockConnectedSdk)),
  } as unknown as Safe

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(coreSDK, 'initSafeSDK').mockResolvedValue(mockSdk)
    jest.spyOn(sdk, 'tryOffChainTxSigning').mockResolvedValue(signedParentTx)
  })

  it('builds TX_P = approveHash(childSafeTxHash) to the child, off-chain signs it, and returns its hash', async () => {
    const result = await prepareNestedApproveHashTx({
      parentSafe: createParentSafe(),
      childSafeAddress: CHILD_ADDRESS,
      childSafeTxHash: CHILD_SAFE_TX_HASH,
      connectedWalletProvider: MockEip1193Provider,
      readOnlyProvider: {} as unknown as JsonRpcProvider,
    })

    // approveHash is encoded with the child's safeTxHash
    expect(mockEncode).toHaveBeenCalledWith('approveHash', [CHILD_SAFE_TX_HASH])

    // The parent tx targets the child Safe, carries the approveHash calldata, and has no fees
    expect(mockCreateTransaction).toHaveBeenCalledWith({
      transactions: [
        {
          to: CHILD_ADDRESS,
          value: '0',
          data: APPROVE_HASH_DATA,
          operation: 0,
        },
      ],
      onlyCalls: true,
    })

    // The returned tx is the off-chain-signed one, with the correct parent hash
    expect(sdk.tryOffChainTxSigning).toHaveBeenCalledWith(unsignedParentTx, mockConnectedSdk)
    expect(result.parentSafeTx).toBe(signedParentTx)
    expect(result.parentSafeTxHash).toBe(PARENT_SAFE_TX_HASH)
  })

  it('throws when the parent Safe SDK cannot be initialized', async () => {
    jest.spyOn(coreSDK, 'initSafeSDK').mockResolvedValue(undefined)

    await expect(
      prepareNestedApproveHashTx({
        parentSafe: createParentSafe(),
        childSafeAddress: CHILD_ADDRESS,
        childSafeTxHash: CHILD_SAFE_TX_HASH,
        connectedWalletProvider: MockEip1193Provider,
        readOnlyProvider: {} as unknown as JsonRpcProvider,
      }),
    ).rejects.toThrow('Could not initialize the parent Safe SDK')
  })
})
