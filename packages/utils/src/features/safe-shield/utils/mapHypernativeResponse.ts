import {
  HypernativeFinding,
  HypernativeRiskSeverityMap,
  HypernativeRiskTypeMap,
  type HypernativeRisk,
  type HypernativeBalanceChanges,
  HypernativeRiskTitleMap,
  HypernativeRiskDescriptionMap,
  type AllowedThreatStatusForHypernative,
} from '../types/hypernative.type'
import {
  HypernativeAssessmentResponseDto,
  HypernativeAssessmentFailedResponseDto,
  isHypernativeAssessmentFailedResponse,
} from '@safe-global/store/hypernative/hypernativeApi.dto'
import { Severity, StatusGroup, ThreatStatus, type ThreatAnalysisResults, type AnalysisResult } from '../types'
import { sortBySeverity } from './analysisUtils'
import type { BalanceChangeDto } from '@safe-global/store/gateway/AUTO_GENERATED/safe-shield'
import { ZeroAddress } from 'ethers'

/**
 * Maps Hypernative assessment response to Safe Shield ThreatAnalysisResults format
 *
 * @param {HypernativeAssessmentResponse | HypernativeAssessmentFailedResponse} response - The Hypernative assessment response
 *
 * @returns {ThreatAnalysisResults} ThreatAnalysisResults in Safe Shield format
 */
export function mapHypernativeResponse(
  response: HypernativeAssessmentResponseDto['data'] | HypernativeAssessmentFailedResponseDto,
  safeAddress: `0x${string}`,
): ThreatAnalysisResults {
  if (isHypernativeAssessmentFailedResponse(response)) {
    return createErrorResult(response.error)
  }

  const assessment = response.assessmentData
  const balanceChanges = assessment.balanceChanges
    ? mapBalanceChanges(safeAddress, assessment.balanceChanges)
    : undefined

  return {
    [StatusGroup.THREAT]: mapThreatFindings(assessment.findings.THREAT_ANALYSIS),
    [StatusGroup.CUSTOM_CHECKS]: mapCustomChecksFindings(assessment.findings.CUSTOM_CHECKS),
    ...(balanceChanges && balanceChanges.length ? { BALANCE_CHANGE: balanceChanges } : {}),
  } as ThreatAnalysisResults
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
        description: error ?? 'The threat analysis failed.',
      },
    ],
  }
}

/**
 * Maps a Hypernative finding group to Safe Shield threat analysis results
 *
 * @param {HypernativeFindingGroup} findings - Hypernative findings object containing status and risks
 *
 * @returns {AnalysisResult<AllowedThreatStatusForHypernative>[]} Array of threat analysis results
 */
function mapThreatFindings(findings: HypernativeFinding): AnalysisResult<AllowedThreatStatusForHypernative>[] {
  if (findings.risks.length === 0) {
    return createNoThreatResult()
  }

  return mapFindings(findings)
}

/**
 * Maps a Hypernative finding group to Safe Shield custom checks analysis results
 *
 * @param {HypernativeFindingGroup} findings - Hypernative findings object containing status and risks
 *
 * @returns {AnalysisResult<AllowedThreatStatusForHypernative>[]} Array of custom checks analysis results
 */
function mapCustomChecksFindings(findings: HypernativeFinding): AnalysisResult<AllowedThreatStatusForHypernative>[] {
  if (findings.risks.length === 0) {
    return createNoCustomChecksResult()
  }

  return mapFindings(findings)
}

/**
 * Maps a Hypernative finding group to Safe Shield threat analysis results
 *
 * @param {HypernativeFindingGroup} findings - Hypernative findings object containing status and risks
 *
 * @returns {AnalysisResult<AllowedThreatStatusForHypernative>[]} Array of analysis results for a given finding group
 */
function mapFindings(findings: HypernativeFinding): AnalysisResult<AllowedThreatStatusForHypernative>[] {
  const results: AnalysisResult<AllowedThreatStatusForHypernative>[] = findings.risks.map((risk: HypernativeRisk) => {
    const mappedType = HypernativeRiskTypeMap[risk.safeCheckId] ?? ThreatStatus.HYPERNATIVE_GUARD
    // MASTERCOPY_CHANGE requires additional fields (before/after) that Hypernative doesn't provide
    // So we fall back to HYPERNATIVE_GUARD for these cases
    const type = mappedType === ThreatStatus.MASTERCOPY_CHANGE ? ThreatStatus.HYPERNATIVE_GUARD : mappedType

    const severity = HypernativeRiskSeverityMap[risk.severity] ?? Severity.INFO

    const mappedTitle = HypernativeRiskTitleMap[type] ?? HypernativeRiskTitleMap[severity]
    const title = mappedTitle ?? risk.title

    const mappedDetails = HypernativeRiskDescriptionMap[type] ?? (mappedTitle ? risk.title : risk.details)
    const details = mappedDetails.length > 0 && !mappedDetails.endsWith('.') ? `${mappedDetails}.` : mappedDetails

    const description = `${details.length > 0 ? `${details} ` : ''}The full threat report is available in your Hypernative account.`

    return { severity, type, title, description }
  })

  return sortBySeverity(results)
}

/**
 * Creates a success result indicating no threats were detected
 *
 * @returns {AnalysisResult<ThreatStatus.NO_THREAT>[]} Array with a single OK-severity result indicating no threats
 */
function createNoThreatResult(): AnalysisResult<ThreatStatus.NO_THREAT>[] {
  return [
    {
      severity: Severity.OK,
      type: ThreatStatus.NO_THREAT,
      title: 'No threats detected',
      description: 'Threat analysis found no issues.',
    },
  ]
}

/**
 * Creates a success result indicating no custom checks were detected
 *
 * @returns {AnalysisResult<ThreatStatus.NO_THREAT>[]} Array with a single OK-severity result indicating no custom checks were detected
 */
function createNoCustomChecksResult(): AnalysisResult<ThreatStatus.NO_THREAT>[] {
  return [
    {
      severity: Severity.OK,
      type: ThreatStatus.NO_THREAT,
      title: 'Custom checks',
      description: 'Custom checks found no issues.',
    },
  ]
}

/**
 * Maps Hypernative balance changes to Safe Shield BalanceChangeDto format
 *
 * @param {HypernativeBalanceChanges} balanceChanges - Balance changes from Hypernative API
 *
 * @returns {BalanceChangeDto[]} Array of balance change DTOs grouped by token address
 */
function mapBalanceChanges(safeAddress: `0x${string}`, balanceChanges: HypernativeBalanceChanges): BalanceChangeDto[] {
  // Normalize keys to lowercase to handle both checksummed and lowercase addresses from the API
  const normalizedBalanceChanges = Object.entries(balanceChanges).reduce<HypernativeBalanceChanges>(
    (acc, [address, changes]) => {
      acc[address.toLowerCase() as `0x${string}`] = changes
      return acc
    },
    {},
  )

  const safeBalanceChanges = normalizedBalanceChanges[safeAddress.toLowerCase() as `0x${string}`] || []

  // Group balance changes by token address
  // Normalize tokenAddress to lowercase for grouping to handle case variations from the API
  const changesByTokenAddress = safeBalanceChanges.reduce<Record<`0x${string}`, BalanceChangeDto>>((acc, change) => {
    const originalTokenAddress = change.tokenAddress ?? ZeroAddress
    const normalizedTokenAddress = originalTokenAddress.toLowerCase() as `0x${string}`
    const isNative = !change.tokenAddress

    const asset = isNative
      ? {
          type: 'NATIVE' as const,
          symbol: change.tokenSymbol,
        }
      : {
          type: 'ERC20' as const,
          symbol: change.tokenSymbol,
          address: normalizedTokenAddress,
        }

    const changes = acc[normalizedTokenAddress] || {
      asset,
      in: [],
      out: [],
    }

    if (change.changeType === 'receive') {
      changes.in.push({ value: change.amount })
    } else {
      changes.out.push({ value: change.amount })
    }

    acc[normalizedTokenAddress] = changes

    return acc
  }, {})

  return Object.values(changesByTokenAddress)
}
