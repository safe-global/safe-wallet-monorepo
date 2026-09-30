import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { SpendingLimitState } from '../types'

/** The AllowanceModule keys an allowance on (safe, delegate, token), so this pair identifies one limit. */
export const isSpendingLimitFor = (limit: SpendingLimitState, beneficiary: string, tokenAddress: string): boolean =>
  sameAddress(limit.beneficiary, beneficiary) && sameAddress(limit.token.address, tokenAddress)
