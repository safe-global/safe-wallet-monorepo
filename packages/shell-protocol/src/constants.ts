/**
 * Protocol version for shell-iframe communication
 * Used to ensure compatibility between shell and account app
 */
export const PROTOCOL_VERSION = '1.0.0'

/**
 * Message source identifiers
 */
export type MessageSource = 'safe-shell' | 'safe-account-app'

/**
 * Message sources enum for validation
 */
export const MESSAGE_SOURCES = {
  SHELL: 'safe-shell' as const,
  ACCOUNT_APP: 'safe-account-app' as const,
}

/**
 * Default timeout for request/response messages (in milliseconds)
 */
export const DEFAULT_MESSAGE_TIMEOUT = 30000

/**
 * Environment variable names
 */
export const ENV_VARS = {
  ACCOUNT_APP_URL: 'NEXT_PUBLIC_ACCOUNT_APP_URL',
  IS_IFRAME_MODE: 'NEXT_PUBLIC_IS_IFRAME_MODE',
} as const
