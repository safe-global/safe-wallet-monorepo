import { StatusGroup, type ThreatAnalysisResults } from '@safe-global/utils/features/safe-shield/types'
import isEmpty from 'lodash/isEmpty'

/**
 * Whether the threat analysis has results for the threat card: findings, or the failure of the check.
 * Balance changes and custom checks have cards of their own.
 */
export const hasThreatCardResults = (threatResults: ThreatAnalysisResults | undefined): boolean =>
  !isEmpty(threatResults?.THREAT) || !isEmpty(threatResults?.[StatusGroup.COMMON])
