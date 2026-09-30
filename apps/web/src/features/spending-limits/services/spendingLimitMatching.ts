import { parseUnits } from 'ethers'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { SpendingLimitState } from '../types'

/**
 * Tells whether an on-chain limit belongs to a given spender and token.
 *
 * @param limit - A limit as the chain holds it.
 * @param beneficiary - The spender to test it against.
 * @param tokenAddress - The token to test it against.
 * @returns `true` when `limit` is that spender's limit for that token.
 *
 * @remarks
 * The AllowanceModule files every allowance under `(safe, delegate, token)`, so this pair names
 * exactly one limit. Pairing a form row with the chain by position would break when a row moves.
 */
export const isSpendingLimitFor = (limit: SpendingLimitState, beneficiary: string, tokenAddress: string): boolean =>
  sameAddress(limit.beneficiary, beneficiary) && sameAddress(limit.token.address, tokenAddress)

/** A limit as it is held off chain: the amount the way a person types it (`'100'`), the period in minutes. */
export type AllowanceValue = { amount: string; resetTime: string }

/**
 * Compares a limit as the form holds it against the limit the Safe holds on chain.
 *
 * @param value - One row of the form: `amount` as typed (`'100'`), `resetTime` in minutes.
 * @param onChain - The limit the Safe holds, whose `amount` is in base units (`'100000000'` for six
 *   decimals) and so is never comparable with `value.amount` as text.
 * @returns `true` when amount and period both match; `false` when the token's decimals are unknown,
 *   leaving nothing to convert with.
 * @throws When `value.amount` cannot be parsed — half-typed, or more precise than the token allows.
 *
 * @remarks
 * The one place "did this change?" is decided: the transaction builder, the summary and the gate on
 * `Next` all ask it, so the page, the batch and the button cannot drift apart.
 */
export const isSameAllowance = (value: AllowanceValue, onChain: SpendingLimitState): boolean => {
  const { decimals } = onChain.token
  if (decimals == null) return false

  return (
    parseUnits(value.amount, decimals) === BigInt(onChain.amount) &&
    Number(value.resetTime) === Number(onChain.resetTimeMin)
  )
}

/**
 * @param addresses - Addresses, possibly repeated and in mixed casing.
 * @returns One entry per distinct address, keeping the first spelling seen, so `0xAb…` and `0xab…`
 *   count as one delegate and the batch never registers the same spender twice.
 */
export const distinctAddresses = (addresses: readonly string[]): string[] =>
  addresses.reduce<string[]>(
    (unique, address) => (unique.some((known) => sameAddress(known, address)) ? unique : [...unique, address]),
    [],
  )
