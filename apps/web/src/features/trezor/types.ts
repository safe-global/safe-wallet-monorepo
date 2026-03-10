/**
 * Transaction hash value (0x-prefixed hex string)
 */
export type TransactionHash = string

/**
 * Store state: transaction hash to display, or undefined when dialog is hidden
 */
export type TrezorHashState = TransactionHash | undefined
