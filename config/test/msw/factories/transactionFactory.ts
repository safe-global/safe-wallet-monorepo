import { faker } from '@faker-js/faker'
import { createMockAddress } from './safeFactory'

/**
 * Transaction mock data factory
 *
 * Generates mock transaction data for Storybook stories.
 */

export type MockTransactionInfo = {
  type: 'Custom' | 'Transfer' | 'SettingsChange' | 'Creation'
  to?: {
    value: string
    name: string | null
    logoUri: string | null
  }
  dataSize?: string
  value?: string
  isCancellation?: boolean
  methodName?: string | null
}

export type MockTransactionDetails = {
  txInfo: MockTransactionInfo
  safeAddress: string
  txId: string
  txStatus: 'AWAITING_CONFIRMATIONS' | 'AWAITING_EXECUTION' | 'SUCCESS' | 'FAILED' | 'CANCELLED'
  executedAt: number | null
  txHash: string | null
  detailedExecutionInfo?: {
    type: 'MULTISIG'
    nonce: number
    confirmationsRequired: number
    confirmationsSubmitted: number
    confirmations: Array<{
      signer: { value: string }
      signature: string
      submittedAt: number
    }>
  }
}

export type MockQueuedTransaction = {
  type: 'TRANSACTION' | 'LABEL' | 'CONFLICT_HEADER'
  transaction?: MockTransactionDetails
  label?: string
  nonce?: number
}

/**
 * Create a mock transaction ID
 */
export const createMockTxId = (safeAddress?: string, safeTxHash?: string): string => {
  const safe = safeAddress ?? createMockAddress()
  const hash = safeTxHash ?? faker.string.hexadecimal({ length: 64, prefix: '0x' })
  return `multisig_${safe}_${hash}`
}

/**
 * Create a mock transaction hash
 */
export const createMockTxHash = (): string => faker.string.hexadecimal({ length: 64, prefix: '0x' })

/**
 * Create mock transaction info
 */
export const createMockTransactionInfo = (overrides?: Partial<MockTransactionInfo>): MockTransactionInfo => ({
  type: 'Custom',
  to: {
    value: createMockAddress(),
    name: 'Test Contract',
    logoUri: null,
  },
  dataSize: '100',
  value: '0',
  isCancellation: false,
  methodName: null,
  ...overrides,
})

/**
 * Create mock transaction details
 */
export const createMockTransactionDetails = (overrides?: Partial<MockTransactionDetails>): MockTransactionDetails => {
  const safeAddress = overrides?.safeAddress ?? createMockAddress()

  return {
    txInfo: createMockTransactionInfo(),
    safeAddress,
    txId: createMockTxId(safeAddress),
    txStatus: 'AWAITING_CONFIRMATIONS',
    executedAt: null,
    txHash: null,
    ...overrides,
  }
}

/**
 * Create mock confirmation
 */
export const createMockConfirmation = (signerAddress?: string) => ({
  signer: { value: signerAddress ?? createMockAddress() },
  signature: faker.string.hexadecimal({ length: 130, prefix: '0x' }),
  submittedAt: Date.now(),
})

/**
 * Create mock detailed execution info
 */
export const createMockExecutionInfo = (confirmationsRequired: number, confirmationsSubmitted: number, nonce = 0) => ({
  type: 'MULTISIG' as const,
  nonce,
  confirmationsRequired,
  confirmationsSubmitted,
  confirmations: Array.from({ length: confirmationsSubmitted }, () => createMockConfirmation()),
})

/**
 * Preset transaction configurations for common scenarios
 */
export const transactionMocks = {
  /** Transaction awaiting first confirmation */
  pendingFirst: () =>
    createMockTransactionDetails({
      txStatus: 'AWAITING_CONFIRMATIONS',
      detailedExecutionInfo: createMockExecutionInfo(2, 0),
    }),

  /** Transaction with 1 of 2 confirmations */
  pendingSecond: () =>
    createMockTransactionDetails({
      txStatus: 'AWAITING_CONFIRMATIONS',
      detailedExecutionInfo: createMockExecutionInfo(2, 1),
    }),

  /** Transaction ready for execution */
  readyToExecute: () =>
    createMockTransactionDetails({
      txStatus: 'AWAITING_EXECUTION',
      detailedExecutionInfo: createMockExecutionInfo(2, 2),
    }),

  /** Successfully executed transaction */
  executed: () =>
    createMockTransactionDetails({
      txStatus: 'SUCCESS',
      executedAt: Date.now() - 3600000, // 1 hour ago
      txHash: createMockTxHash(),
      detailedExecutionInfo: createMockExecutionInfo(2, 2),
    }),

  /** Failed transaction */
  failed: () =>
    createMockTransactionDetails({
      txStatus: 'FAILED',
      executedAt: Date.now() - 3600000,
      txHash: createMockTxHash(),
    }),

  /** Cancelled transaction */
  cancelled: () =>
    createMockTransactionDetails({
      txStatus: 'CANCELLED',
      txInfo: createMockTransactionInfo({ isCancellation: true }),
    }),

  /** ETH transfer transaction */
  ethTransfer: () =>
    createMockTransactionDetails({
      txInfo: createMockTransactionInfo({
        type: 'Transfer',
        value: '1000000000000000000', // 1 ETH
        methodName: null,
        dataSize: '0',
      }),
    }),

  /** Contract interaction */
  contractCall: () =>
    createMockTransactionDetails({
      txInfo: createMockTransactionInfo({
        type: 'Custom',
        methodName: 'transfer',
        dataSize: '68',
      }),
    }),
}

/**
 * Create a mock queued transaction list
 */
export const createMockQueuedList = (transactions: MockTransactionDetails[]) => ({
  count: transactions.length,
  next: null,
  previous: null,
  results: transactions.map((tx) => ({
    type: 'TRANSACTION' as const,
    transaction: tx,
  })),
})

/**
 * Create an empty transaction history
 */
export const createEmptyHistory = () => ({
  count: 0,
  next: null,
  previous: null,
  results: [],
})
