/**
 * Mock data factories for Storybook stories
 *
 * These factories generate deterministic mock data for testing and stories.
 * Use the preset mocks for common scenarios or create custom data with the factory functions.
 */

// Safe factories
export {
  createMockAddress,
  createMockOwner,
  createMockOwners,
  createMockSafeInfo,
  createMockMasterCopy,
  createAllMasterCopies,
  safeMocks,
  SAFE_MASTER_COPIES,
  FALLBACK_HANDLER,
} from './safeFactory'
export type { MockSafeOwner, MockSafeInfo, MockMasterCopy } from './safeFactory'

// Transaction factories
export {
  createMockTxId,
  createMockTxHash,
  createMockTransactionInfo,
  createMockTransactionDetails,
  createMockConfirmation,
  createMockExecutionInfo,
  createMockQueuedList,
  createEmptyHistory,
  transactionMocks,
} from './transactionFactory'
export type { MockTransactionInfo, MockTransactionDetails, MockQueuedTransaction } from './transactionFactory'

// Token factories
export {
  createMockTokenInfo,
  createNativeTokenInfo,
  createMockBalance,
  createKnownTokenBalance,
  createMockCollectible,
  balanceMocks,
  collectibleMocks,
  supportedFiatCurrencies,
  KNOWN_TOKENS,
} from './tokenFactory'
export type { MockTokenInfo, MockBalance, MockCollectible } from './tokenFactory'
