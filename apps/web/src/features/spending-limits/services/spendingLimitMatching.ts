import { parseUnits } from 'ethers'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { SpendingLimitState } from '../types'

/** The AllowanceModule keys an allowance on (safe, delegate, token), so this pair identifies one limit. */
export const isSpendingLimitFor = (limit: SpendingLimitState, beneficiary: string, tokenAddress: string): boolean =>
  sameAddress(limit.beneficiary, beneficiary) && sameAddress(limit.token.address, tokenAddress)

/** A limit as it is held anywhere but on chain: human-readable amount, reset period in minutes. */
export type AllowanceValue = { amount: string; resetTime: string }

/**
 * Shared so the transaction and the summary the signer reads cannot disagree about what changed.
 * Without the chain's decimals there are no base units to compare, so the limit counts as changed.
 */
export const isSameAllowance = (value: AllowanceValue, onChain: SpendingLimitState): boolean => {
  const { decimals } = onChain.token
  if (decimals == null) return false

  return (
    parseUnits(value.amount, decimals) === BigInt(onChain.amount) &&
    Number(value.resetTime) === Number(onChain.resetTimeMin)
  )
}

/** Addresses are compared, not their casing, so the same delegate is never listed twice. */
export const distinctAddresses = (addresses: readonly string[]): string[] =>
  addresses.reduce<string[]>(
    (unique, address) => (unique.some((known) => sameAddress(known, address)) ? unique : [...unique, address]),
    [],
  )
