import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { SCANNERS } from '../../data/scanners/registry'
import { CHECK_DEFS } from '../../data/securityChecks'
import {
  scanKey,
  computeSummary,
  severityRank,
  getSafeGrade,
  formatTimestamp,
  withScannerTimeout,
} from '../utils/scanUtils'
import { getScoreBand } from '../../data/scoreBands'
import { isKnownModuleByName } from '../../data/scanners/modules'
import { getCachedScan, setCachedScan } from '../../data/scanResultsCache'

/** Security Hub services: the scanner registry, check definitions and pure helpers. */
export const securityServices = {
  // Scanner registry + UI metadata
  scanners: SCANNERS,
  checkDefs: CHECK_DEFS,
  // Pure utilities
  scanKey,
  computeSummary,
  severityRank,
  getSafeGrade,
  formatTimestamp,
  withScannerTimeout,
  isKnownModuleByName,
  getScoreBand,
  // Module-level cache accessors
  getCachedScan,
  setCachedScan,
  // Shared constants
  zeroAddress: ZERO_ADDRESS,
}

export type SecurityServices = typeof securityServices
