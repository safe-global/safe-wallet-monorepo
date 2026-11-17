import { StatusGroup, type ThreatAnalysisResults } from '@safe-global/utils/features/safe-shield/types'
import { ErrorType, getErrorInfo } from '@safe-global/utils/features/safe-shield/utils/errors'
import { ThreatAnalysisBuilder } from '@safe-global/utils/features/safe-shield/builders/threat-analysis.builder'
import { ThreatAnalysisResultBuilder } from '@safe-global/utils/features/safe-shield/builders/threat-analysis-result.builder'
import { hasThreatCardResults } from '../hasThreatCardResults'

describe('hasThreatCardResults', () => {
  it('is true when the threat analysis has findings', () => {
    const [threatResults] = ThreatAnalysisBuilder.noThreat()

    expect(hasThreatCardResults(threatResults)).toBe(true)
  })

  it('is true when the threat check failed and has only the failure', () => {
    const threatResults: ThreatAnalysisResults = { [StatusGroup.COMMON]: [getErrorInfo(ErrorType.THREAT)] }

    expect(hasThreatCardResults(threatResults)).toBe(true)
  })

  it('is false when there is no threat analysis', () => {
    expect(hasThreatCardResults(undefined)).toBe(false)
  })

  it('is false when the threat analysis is empty', () => {
    expect(hasThreatCardResults({ THREAT: [], [StatusGroup.COMMON]: [] })).toBe(false)
  })

  it('is false when the threat analysis has only balance changes and custom checks', () => {
    const [withBalanceChange] = new ThreatAnalysisBuilder().build()
    const threatResults: ThreatAnalysisResults = {
      BALANCE_CHANGE: withBalanceChange?.BALANCE_CHANGE,
      CUSTOM_CHECKS: [ThreatAnalysisResultBuilder.noThreat().build()],
      request_id: 'request-id',
    }

    expect(hasThreatCardResults(threatResults)).toBe(false)
  })
})
