import type { PolicyConfiguration } from '@/features/policy-guard/public/types'

export type ApplyAllowlistFlowData = {
  chainId: string
  safeAddress: string
  guardAddress: string
  /** The pre-image of the requested root, as stored in CGW. */
  configurations: PolicyConfiguration[]
}
