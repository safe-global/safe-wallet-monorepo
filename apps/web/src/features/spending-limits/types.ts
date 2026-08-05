import type { BigNumberish, BytesLike } from 'ethers'
import { TokenAmountFields } from '@/components/tx-flow/flows/TokenTransfer/types'

// Re-export the type from the slice (where it's defined to avoid pulling deps into main bundle)
export type { SpendingLimitState } from './store/spendingLimitsSlice'

// Form fields for creating spending limits
enum SpendingLimitFormFields {
  beneficiary = 'beneficiary',
  limits = 'limits',
  resetTime = 'resetTime',
}

export const SpendingLimitFields = { ...SpendingLimitFormFields, ...TokenAmountFields }

export type SpendingLimitRowValues = {
  [SpendingLimitFields.tokenAddress]: string
  [SpendingLimitFields.amount]: string
  [SpendingLimitFields.resetTime]: string
}

export type NewSpendingLimitFlowProps = {
  [SpendingLimitFields.beneficiary]: string
  [SpendingLimitFields.limits]: SpendingLimitRowValues[]
}

export type NewSpendingLimitData = {
  beneficiary: string
  limits: {
    tokenAddress: string
    amount: string
    resetTime: string
    // Resolved by the review screen from the balances list
    decimals?: number | null
  }[]
}

export type SpendingLimitTxParams = {
  safeAddress: string
  token: string
  to: string
  amount: BigNumberish
  paymentToken: string
  payment: BigNumberish
  delegate: string
  signature: BytesLike
}
