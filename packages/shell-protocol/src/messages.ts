import type { MessageSource } from './constants'

/**
 * Base message structure for all shell-iframe communication
 */
export interface BaseMessage<T = unknown> {
  source: MessageSource
  version: string
  type: string
  requestId?: string
  payload: T
}

/**
 * Wallet state shared between shell and iframe
 */
export interface WalletState {
  address: string | null
  chainId: string | null
  isConnected: boolean
  label: string | null
  ens?: string
  balance?: string
}

/**
 * Sign message request payload
 */
export interface SignMessageRequest {
  message: string
  method: 'personal_sign' | 'eth_signTypedData_v4'
}

/**
 * Transaction request payload
 */
export interface TransactionRequest {
  to: string
  value: string
  data: string
  gasLimit?: string
}

/**
 * RPC request payload
 */
export interface RpcRequest {
  method: string
  params: unknown[]
}

/**
 * Navigation payload
 */
export interface NavigationPayload {
  path: string
  query?: Record<string, string>
}

/**
 * Theme change payload
 */
export interface ThemePayload {
  mode: 'light' | 'dark'
}

/**
 * Generic response payload
 */
export interface ResponsePayload<T = unknown> {
  data?: T
  error?: string
}

/**
 * Messages sent from Shell to Account App
 */
export type ShellToAccountMessage =
  | {
      type: 'WALLET_STATE_CHANGED'
      payload: WalletState
    }
  | {
      type: 'THEME_CHANGED'
      payload: ThemePayload
    }
  | {
      type: 'NAVIGATE'
      payload: NavigationPayload
    }
  | {
      type: 'RESPONSE'
      requestId: string
      payload: ResponsePayload
    }

/**
 * Messages sent from Account App to Shell
 */
export type AccountToShellMessage =
  | {
      type: 'REQUEST_WALLET_STATE'
      requestId: string
    }
  | {
      type: 'REQUEST_CONNECT_WALLET'
      requestId: string
    }
  | {
      type: 'REQUEST_DISCONNECT_WALLET'
      requestId: string
    }
  | {
      type: 'REQUEST_SWITCH_CHAIN'
      requestId: string
      payload: { chainId: string }
    }
  | {
      type: 'NAVIGATION_CHANGED'
      payload: NavigationPayload
    }
  | {
      type: 'APP_READY'
      payload: { version: string }
    }
  | {
      type: 'RPC_REQUEST'
      requestId: string
      payload: RpcRequest
    }
  | {
      type: 'RESPONSE'
      requestId: string
      payload: ResponsePayload
    }

/**
 * Union of all message types
 */
export type ShellMessage = BaseMessage<ShellToAccountMessage | AccountToShellMessage>

/**
 * Type guard to check if a message is from the shell
 */
export function isShellMessage(msg: unknown): msg is BaseMessage<ShellToAccountMessage> {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'source' in msg &&
    msg.source === 'safe-shell' &&
    'type' in msg &&
    'version' in msg
  )
}

/**
 * Type guard to check if a message is from the account app
 */
export function isAccountAppMessage(msg: unknown): msg is BaseMessage<AccountToShellMessage> {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'source' in msg &&
    msg.source === 'safe-account-app' &&
    'type' in msg &&
    'version' in msg
  )
}
