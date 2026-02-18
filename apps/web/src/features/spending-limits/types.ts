import type { BigNumberish, BytesLike } from 'ethers'
import { TokenAmountFields } from '@/components/tx-flow/flows/TokenTransfer/types'

// Re-export the type from the slice (where it's defined to avoid pulling deps into main bundle)
export type { SpendingLimitState } from './store/spendingLimitsSlice'

// Form fields for creating spending limits
enum SpendingLimitFormFields {
  beneficiary = 'beneficiary',
  resetTime = 'resetTime',
}

export const SpendingLimitFields = { ...SpendingLimitFormFields, ...TokenAmountFields }

export type NewSpendingLimitFlowProps = {
  [SpendingLimitFields.beneficiary]: string
  [SpendingLimitFields.tokenAddress]: string
  [SpendingLimitFields.amount]: string
  [SpendingLimitFields.resetTime]: string
}

export type NewSpendingLimitData = {
  beneficiary: string
  tokenAddress: string
  amount: string
  resetTime: string
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
