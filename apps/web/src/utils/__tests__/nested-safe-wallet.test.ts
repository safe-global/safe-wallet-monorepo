import { concat, getAddress, keccak256, toBeHex, type JsonRpcProvider } from 'ethers'
import type { NextRouter } from 'next/router'
import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { getNestedWallet } from '../nested-safe-wallet'
import * as safeCoreSDK from '@/hooks/coreSDK/safeCoreSDK'
import * as wallets from '@/utils/wallets'
import * as txSenderSdk from '@/services/tx/tx-sender/sdk'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'
import type Safe from '@safe-global/protocol-kit'
import type { SafeTransaction } from '@safe-global/types-kit'
import {
  APPROVE_HASH_SELECTOR,
  type NestedTxEnvelope,
  deriveEnvelopeSafeTxHash,
  encodeNestedTxPayload,
} from '@/services/tx/nestedTxEnvelope'

jest.mock('@/services/tx/proposeTransaction', () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve({ txId: 'tx_id' })),
}))

const PARENT_SAFE = getAddress(toBeHex('0xabc', 20))
const CHILD_SAFE = getAddress(toBeHex('0xdef', 20))
const SIGNER = getAddress(toBeHex('0x111', 20))
const ZERO_ADDRESS = getAddress(toBeHex('0x0', 20))

const childEnvelope: NestedTxEnvelope = {
  chainId: '1',
  safe: CHILD_SAFE,
  nonce: 7,
  to: getAddress(toBeHex('0x123', 20)),
  value: '1000000000000000000',
  data: '0xabcdef',
  operation: 0,
  safeTxGas: '0',
  baseGas: '0',
  gasPrice: '0',
  gasToken: ZERO_ADDRESS,
  refundReceiver: ZERO_ADDRESS,
}

const safeInfo = {
  chainId: '1',
  address: { value: PARENT_SAFE },
  version: '1.3.0',
  implementationVersionState: 'UP_TO_DATE',
  implementation: { value: toBeHex('0x222', 20) },
  threshold: 2,
  deployed: true,
} as unknown as SafeState

const actualWallet = {
  address: SIGNER,
  chainId: '1',
  provider: {} as ConnectedWallet['provider'],
} as ConnectedWallet

describe('getNestedWallet send', () => {
  const mockCreateTransaction = jest.fn<
    SafeTransaction,
    [{ transactions: { to: string; value: string; data: string; operation: number }[] }]
  >(() => ({ data: { nonce: 1 }, signatures: new Map(), addSignature: jest.fn() }) as unknown as SafeTransaction)

  const mockConnectedSdk = {
    createTransaction: mockCreateTransaction,
    getTransactionHash: jest.fn(() => Promise.resolve(keccak256('0x01'))),
    approveTransactionHash: jest.fn(() => Promise.resolve({ hash: '0xhash' })),
    executeTransaction: jest.fn(() => Promise.resolve({ hash: '0xhash' })),
  } as unknown as Safe

  const sendTransaction = async (data: string) => {
    const nestedWallet = getNestedWallet(actualWallet, safeInfo, {} as JsonRpcProvider, {} as NextRouter)
    return nestedWallet.provider?.request({
      method: 'eth_sendTransaction',
      params: [{ from: PARENT_SAFE, to: CHILD_SAFE, value: '0x0', data }],
    })
  }

  const getCreatedTxData = (): string => mockCreateTransaction.mock.calls[0][0].transactions[0].data

  beforeEach(() => {
    jest.clearAllMocks()

    jest.spyOn(safeCoreSDK, 'initSafeSDK').mockResolvedValue({
      connect: jest.fn(() => Promise.resolve(mockConnectedSdk)),
    } as unknown as Safe)
    jest.spyOn(wallets, 'isSmartContractWallet').mockResolvedValue(true)
    jest.spyOn(txSenderSdk, 'tryOffChainTxSigning').mockResolvedValue({} as SafeTransaction)
  })

  it('passes non-approveHash calldata through unchanged', async () => {
    await sendTransaction('0xdeadbeef')

    expect(getCreatedTxData()).toBe('0xdeadbeef')
  })

  it('passes plain 36-byte approveHash calldata through unchanged', async () => {
    const data = concat([APPROVE_HASH_SELECTOR, keccak256('0x01')])

    await sendTransaction(data)

    expect(getCreatedTxData()).toBe(data)
  })

  it('passes approveHash calldata with unknown trailing bytes through unchanged', async () => {
    const data = concat([APPROVE_HASH_SELECTOR, keccak256('0x01'), '0x001122'])

    await sendTransaction(data)

    expect(getCreatedTxData()).toBe(data)
  })

  it('throws when a decodable envelope does not match the approved hash', async () => {
    const data = concat([APPROVE_HASH_SELECTOR, keccak256('0x01'), encodeNestedTxPayload([childEnvelope])])

    await expect(sendTransaction(data)).rejects.toThrow('Nested transaction payload does not match the approved hash')
    expect(mockCreateTransaction).not.toHaveBeenCalled()
  })

  it('uses the stripped 36-byte calldata when the envelope verifies', async () => {
    const approvedHash = deriveEnvelopeSafeTxHash(childEnvelope)
    const data = concat([APPROVE_HASH_SELECTOR, approvedHash, encodeNestedTxPayload([childEnvelope])])

    await sendTransaction(data)

    expect(getCreatedTxData()).toBe(concat([APPROVE_HASH_SELECTOR, approvedHash]))
  })
})
