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
  status: 'OK' | 'ERROR'
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
