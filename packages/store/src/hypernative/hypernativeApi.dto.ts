import {
  HypernativeAssessmentData,
  HypernativeBalanceChanges,
  HypernativeFinding,
  HypernativeRiskSeverity,
  HypernativeTx,
} from '@safe-global/utils/features/safe-shield/types/hypernative.type'

export type HypernativeAssessmentRequestDto = {
  safeAddress: `0x${string}`
  safeTxHash: `0x${string}`
  transaction: HypernativeTx
  url: string // @Todo: Can we make it optional?
}

export type HypernativeRiskDto = {
  title: string
  details: string
  severity: HypernativeRiskSeverity
}

export type HypernativeAssessmentResponseDto = {
  safeTxHash: `0x${string}`
  status: 'OK'
  assessmentData: HypernativeAssessmentData
  balanceChanges?: HypernativeBalanceChanges
}

export type HypernativeAssessmentFailedResponseDto = {
  status: 'FAILED'
  error: {
    reason: string
    message: string
  }
}

export type HypernativeAssessmentRequestWithAuthDto = HypernativeAssessmentRequestDto & {
  authToken: string
}

/**
 * DTOs for Hypernative OAuth token exchange
 */

export type HypernativeTokenExchangeRequestDto = {
  grant_type: 'authorization_code'
  code: string
  redirect_uri: string
  client_id: string
  code_verifier: string
}

/**
 * Hypernative API token response format
 * The API wraps the OAuth token response in a `data` object
 */
export type HypernativeTokenExchangeResponseDto = {
  data: {
    access_token: string
    expires_in: number
    scope: string
    token_type: string
  }
}
