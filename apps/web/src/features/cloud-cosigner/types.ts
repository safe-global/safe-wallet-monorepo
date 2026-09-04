export type CloudCosignerPolicy = {
  /** Fiat value above which a proposed transaction goes to full review. */
  valueThresholdUsd: number
  /** Whether a first interaction with an unknown contract goes to full review. */
  reviewUnknownContracts: boolean
  /** Free-text rules handed to the reviewer. */
  instructions: string | null
}

export type CloudCosignerInfo = {
  address: string
  defaultPolicy: CloudCosignerPolicy
}

export type SafeCloudCosignerStatus = {
  cosignerAddress: string
  /** Whether the cosigner is currently an owner of the Safe. */
  isEnabled: boolean
  policy: CloudCosignerPolicy
  /** True when no policy is stored and the service defaults apply. */
  isDefaultPolicy: boolean
}

export type UpdateCloudCosignerPolicyRequest = {
  chainId: string
  safeAddress: string
  policy: CloudCosignerPolicy
  signer: string
  signature: string
  issuedAt: string
}

export type CloudCosignerReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SKIPPED' | 'FAILED'

export type CloudCosignerReview = {
  chainId: string
  safeAddress: string
  safeTxHash: string
  status: CloudCosignerReviewStatus
  mode: 'RULES' | 'LLM' | null
  triggeredRules: string[]
  summary: string | null
  riskFlags: string[]
  model: string | null
  reviewedAt: string
}
