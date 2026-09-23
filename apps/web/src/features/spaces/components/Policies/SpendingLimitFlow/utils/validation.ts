import { sameAddress } from '@safe-global/utils/utils/addresses'
import { validateAmount, validateDecimalLength } from '@safe-global/utils/utils/validation'
import type { SpendingLimitState } from '@/features/spending-limits'
import { isSpendingLimitFor, validateSpendingLimitAmount } from '@/features/spending-limits/services'
import { DUPLICATE_SPENDER_ERROR, DUPLICATE_TOKEN_ERROR, EXISTING_LIMIT_ERROR } from '../constants'

/** `setAllowance` is keyed on (safe, delegate, token): a second row for the same spender would overwrite the first. */
export const validateUniqueSpender = (address: string, otherAddresses: readonly string[]): string | undefined =>
  otherAddresses.some((other) => sameAddress(other, address)) ? DUPLICATE_SPENDER_ERROR : undefined

export const validateUniqueToken = (tokenAddress: string, siblingTokens: readonly string[]): string | undefined =>
  siblingTokens.some((other) => sameAddress(other, tokenAddress)) ? DUPLICATE_TOKEN_ERROR : undefined

/** Numeric → decimals → uint96, as the Safe-level form. `decimals` is unknown until a token is picked. */
export const validateLimitAmount = (value: string, decimals: number | undefined): string | undefined =>
  validateAmount(value) || validateDecimalLength(value, decimals) || validateSpendingLimitAmount(value, decimals)

/** The selected Safe already limits this token for this spender; changing it is the edit flow's job (WA-3156). */
export const validateNoExistingLimit = (
  tokenAddress: string,
  spenderAddress: string,
  existing: readonly SpendingLimitState[] | undefined,
): string | undefined =>
  spenderAddress !== '' && existing?.some((limit) => isSpendingLimitFor(limit, spenderAddress, tokenAddress))
    ? EXISTING_LIMIT_ERROR
    : undefined

/** Token addresses the spender already has a limit for on the selected Safe — hidden from their token rows. */
export const existingTokensForSpender = (
  spenderAddress: string,
  existing: readonly SpendingLimitState[] | undefined,
): string[] =>
  spenderAddress === ''
    ? []
    : (existing ?? [])
        .filter((limit) => sameAddress(limit.beneficiary, spenderAddress))
        .map((limit) => limit.token.address)
