import { sameAddress } from '@safe-global/utils/utils/addresses'
import { validateAmount, validateDecimalLength } from '@safe-global/utils/utils/validation'
import { validateSpendingLimitAmount } from '@/features/spending-limits/services'
import { DUPLICATE_SPENDER_ERROR, DUPLICATE_TOKEN_ERROR } from '../constants'

/** `setAllowance` is keyed on (safe, delegate, token): a second row for the same spender would overwrite the first. */
export const validateUniqueSpender = (address: string, otherAddresses: readonly string[]): string | undefined =>
  otherAddresses.some((other) => sameAddress(other, address)) ? DUPLICATE_SPENDER_ERROR : undefined

export const validateUniqueToken = (tokenAddress: string, siblingTokens: readonly string[]): string | undefined =>
  siblingTokens.some((other) => sameAddress(other, tokenAddress)) ? DUPLICATE_TOKEN_ERROR : undefined

/** Numeric → decimals → uint96, as the Safe-level form. `decimals` is unknown until a token is picked. */
export const validateLimitAmount = (value: string, decimals: number | undefined): string | undefined =>
  validateAmount(value) || validateDecimalLength(value, decimals) || validateSpendingLimitAmount(value, decimals)
