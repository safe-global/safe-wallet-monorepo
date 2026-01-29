import {
  HypernativeAssessmentData,
  HypernativeBalanceChanges,
  HypernativeRiskSeverity,
  HypernativeTx,
} from '@safe-global/utils/features/safe-shield/types/hypernative.type'

export type HypernativeAssessmentRequestDto = {
  safeAddress: `0x${string}`
  safeTxHash: `0x${string}`
  transaction: HypernativeTx
  url?: string
}

export type HypernativeRiskDto = {
  title: string
  details: string
  severity: HypernativeRiskSeverity
}

export type HypernativeAssessmentResponseDto = {
  data: {
    safeTxHash: `0x${string}`
    status: 'OK'
    assessmentData: HypernativeAssessmentData
  }
}

export type HypernativeAssessmentFailedResponseDto = {
  error: string
  errorCode: number
  success: false
  data: null
}

export function isHypernativeAssessmentFailedResponse(error: unknown): error is HypernativeAssessmentFailedResponseDto {
  return typeof error === 'object' && error != null && 'error' in error && 'success' in error && error.success === false
}

export type HypernativeAssessmentRequestWithAuthDto = HypernativeAssessmentRequestDto & {
  authToken: string
}

/**
 * DTOs for Hypernative batch assessment retrieval
 */

export type HypernativeBatchAssessmentRequestDto = {
  safeTxHashes: `0x${string}`[]
}

export type HypernativeBatchAssessmentResponseItemDto = {
  safeTxHash: `0x${string}`
  status: 'OK' | 'NOT_FOUND'
  assessmentData: HypernativeAssessmentData | null
  parsedActions?: {
    approval?: unknown[]
    transfer?: unknown[]
  }
  balanceChanges?: HypernativeBalanceChanges
}

export type HypernativeBatchAssessmentResponseDto = { data: HypernativeBatchAssessmentResponseItemDto[] }

export type HypernativeBatchAssessmentRequestWithAuthDto = HypernativeBatchAssessmentRequestDto & {
  authToken: string
}

export type HypernativeBatchAssessmentErrorDto = {
  status: 'FAILED'
  error: {
    reason: 'INVALID_REQUEST' | 'INTERNAL_ERROR'
    message: string
  }
}

export function isHypernativeBatchAssessmentErrorResponse(error: unknown): error is HypernativeBatchAssessmentErrorDto {
  return (
    typeof error === 'object' &&
    error != null &&
    'status' in error &&
    error.status === 'FAILED' &&
    'error' in error &&
    typeof (error as HypernativeBatchAssessmentErrorDto).error === 'object' &&
    (error as HypernativeBatchAssessmentErrorDto).error != null &&
    'reason' in (error as HypernativeBatchAssessmentErrorDto).error &&
    'message' in (error as HypernativeBatchAssessmentErrorDto).error
  )
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

/**
 * DTOs for Hypernative EIP-712 Typed Message Assessment
 */

export type HypernativeEIP712TypeDefinition = {
  name: string
  type: string
}

export type HypernativeEIP712Types = {
  EIP712Domain: HypernativeEIP712TypeDefinition[]
  [key: string]: HypernativeEIP712TypeDefinition[]
}

export type HypernativeEIP712Message = {
  types: HypernativeEIP712Types
  domain: Record<string, unknown>
  message: Record<string, unknown>
  primaryType: string
}

export type HypernativeMessageAssessmentRequestDto = {
  safeAddress: `0x${string}`
  messageHash: `0x${string}`
  message: HypernativeEIP712Message
  proposer?: `0x${string}`
  url?: string
}

export type HypernativeMessageAssessmentRequestWithAuthDto = HypernativeMessageAssessmentRequestDto & {
  authToken: string
}

export type HypernativePermitParsedAction = {
  tokenName: string
  tokenSymbol: string
  tokenAddress: `0x${string}`
  tokenTotalSupply: number
  tokenMarketCap: number
  tokenTotalVolume: number
  amountInUsd: number
  amount: number
  amountAfterDecimals: number
  tokenId: number
  owner: `0x${string}`
  spender: `0x${string}`
  isNft: boolean
  priceSource: string
  logIndex: number
  action: string
}

export type HypernativeMessageAssessmentParsedActions = {
  permit?: HypernativePermitParsedAction[]
}

export type HypernativeMessageAssessmentResponseDto = {
  data: {
    safeTxHash: `0x${string}` // This is the messageHash
    status: 'OK'
    assessmentData: HypernativeAssessmentData
    parsedActions?: HypernativeMessageAssessmentParsedActions
  }
}

export type HypernativeMessageAssessmentErrorDto = {
  status: 'FAILED'
  error: {
    reason: 'MESSAGE_HASH_MISMATCH' | 'INVALID_PAYLOAD' | 'INTERNAL_ERROR'
    message: string
  }
}

export function isHypernativeMessageAssessmentErrorResponse(
  error: unknown,
): error is HypernativeMessageAssessmentErrorDto {
  return (
    typeof error === 'object' &&
    error != null &&
    'status' in error &&
    error.status === 'FAILED' &&
    'error' in error &&
    typeof (error as HypernativeMessageAssessmentErrorDto).error === 'object' &&
    (error as HypernativeMessageAssessmentErrorDto).error != null &&
    'reason' in (error as HypernativeMessageAssessmentErrorDto).error &&
    'message' in (error as HypernativeMessageAssessmentErrorDto).error
  )
}
