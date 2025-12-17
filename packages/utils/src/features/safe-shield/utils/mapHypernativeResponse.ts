import {
  HypernativeFinding,
  HypernativeRiskSeverityMap,
  HypernativeRiskTitleMap,
  type HypernativeRisk,
} from '../types/hypernative.type'
import {
  HypernativeAssessmentResponseDto,
  HypernativeAssessmentFailedResponseDto,
} from '@safe-global/store/hypernative/hypernativeApi.dto'
import { Severity, StatusGroup, ThreatStatus, type ThreatAnalysisResults, type ThreatAnalysisResult } from '../types'
import { sortBySeverity } from './analysisUtils'

/**
 * Maps Hypernative assessment response to Safe Shield ThreatAnalysisResults format
 *
 * @param {HypernativeAssessmentResponse | HypernativeAssessmentFailedResponse} response - The Hypernative assessment response
 *
 * @returns {ThreatAnalysisResults} ThreatAnalysisResults in Safe Shield format
 */
export function mapHypernativeResponse(
  response: HypernativeAssessmentResponseDto['data'] | HypernativeAssessmentFailedResponseDto,
): ThreatAnalysisResults {
  if ('error' in response && response.status === 'FAILED') {
    return createErrorResult(response.error)
  }

  const assessment = response.assessmentData

  return {
    [StatusGroup.THREAT]: mapFindings(assessment.findings.THREAT_ANALYSIS),
    [StatusGroup.CUSTOM_CHECKS]: mapFindings(assessment.findings.CUSTOM_CHECKS),
  }
}

/**
 * Creates an error result when the API returns a failed status
 *
 * @param {HypernativeAssessmentFailedResponse['error']} error - The error object
 *
 * @returns {ThreatAnalysisResults} Threat analysis results with a critical error message
 */
function createErrorResult(error: HypernativeAssessmentFailedResponseDto['error']): ThreatAnalysisResults {
  return {
    [StatusGroup.THREAT]: [
      {
        severity: Severity.CRITICAL,
        type: ThreatStatus.HYPERNATIVE_GUARD,
        title: 'Hypernative analysis failed',
        description: error.message ?? 'The threat analysis failed.',
      },
    ],
  }
}

/**
 * Maps a Hypernative finding group to Safe Shield threat analysis results
 *
 * @param {HypernativeFindingGroup} findings - Hypernative findings object containing status and risks
 *
 * @returns {ThreatAnalysisResult[]} Array of threat analysis results
 */
function mapFindings(findings: HypernativeFinding): ThreatAnalysisResult[] {
  if (findings.risks.length === 0) {
    return createNoThreatResult()
  }

  const results: ThreatAnalysisResult[] = findings.risks.map((risk: HypernativeRisk) => {
    const mappedType = HypernativeRiskTitleMap[risk.safeCheckId] ?? ThreatStatus.HYPERNATIVE_GUARD
    // MASTERCOPY_CHANGE requires additional fields (before/after) that Hypernative doesn't provide
    // So we fall back to HYPERNATIVE_GUARD for these cases
    const type = mappedType === ThreatStatus.MASTERCOPY_CHANGE ? ThreatStatus.HYPERNATIVE_GUARD : mappedType

    return {
      severity: HypernativeRiskSeverityMap[risk.severity] ?? Severity.INFO,
      type,
      title: risk.title,
      description: risk.details,
    }
  })

  return sortBySeverity(results)
}

/**
 * Creates a success result indicating no threats were detected
 *
 * @returns {ThreatAnalysisResult[]} Array with a single OK-severity result indicating no threats
 */
function createNoThreatResult(): ThreatAnalysisResult[] {
  return [
    {
      severity: Severity.OK,
      type: ThreatStatus.NO_THREAT,
      title: 'No threats detected',
      description: 'Threat analysis found no issues.',
    },
  ]
}
