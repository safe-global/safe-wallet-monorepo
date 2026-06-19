import { sameAddress } from './addresses'
import { ZERO_ADDRESS } from './constants'

/**
 * Resolves the target address of a MultiSend batched sub-transaction.
 *
 * `MultiSend` and `MultiSendCallOnly` rewrite a sub-transaction `to` of the zero address to
 * `address(this)` at execution time — the Safe running the batch via `delegatecall`. Transaction
 * decoders faithfully report the raw `0x0`, so any presentation layer that needs the *effective*
 * target (e.g. to label or warn about a self-call) must apply the same resolution.
 *
 * @param to - decoded sub-transaction target (possibly the zero address)
 * @param safeAddress - the Safe executing the batch (MultiSend's `address(this)`)
 * @returns `safeAddress` when `to` is the zero address and `safeAddress` is known, otherwise `to`
 */
export const resolveMultiSendToAddress = (to: string, safeAddress?: string): string =>
  safeAddress && sameAddress(to, ZERO_ADDRESS) ? safeAddress : to
