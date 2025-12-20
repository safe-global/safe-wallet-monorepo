/**
 * @safe-global/shell-protocol
 *
 * Shared communication protocol types for the Shell + Account App architecture.
 * Provides type-safe message definitions for postMessage communication between
 * the Shell app and the Account app (iframe).
 */

// Constants
export { PROTOCOL_VERSION, MESSAGE_SOURCES, DEFAULT_MESSAGE_TIMEOUT, ENV_VARS, type MessageSource } from './constants'

// Message types
export {
  type BaseMessage,
  type WalletState,
  type SignMessageRequest,
  type TransactionRequest,
  type RpcRequest,
  type NavigationPayload,
  type ThemePayload,
  type ResponsePayload,
  type ShellToAccountMessage,
  type AccountToShellMessage,
  type ShellMessage,
  isShellMessage,
  isAccountAppMessage,
} from './messages'

// Wallet interface
export { type ShellWallet } from './wallet-interface'
