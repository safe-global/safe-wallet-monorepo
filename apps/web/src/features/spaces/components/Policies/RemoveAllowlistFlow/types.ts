import type { AllowlistRule } from '../RecipientAllowlistFlow/types'

export type RemoveAllowlistFlowData = {
  chainId: string
  safeAddress: string
  guardAddress: string
  /** The rules the Safe enforces, which the removal deletes. */
  rules: AllowlistRule[]
}
