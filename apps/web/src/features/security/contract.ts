/**
 * Security Feature Contract
 *
 * All services are accessed via useLoadFeature() — stubs return `undefined` until ready.
 * Consumers MUST check `$isReady` before calling any service function or using data.
 *
 * Naming conventions:
 * - All entries are camelCase → service (stub returns undefined)
 * - No components (PascalCase) — security UI lives in the spaces feature
 */

import type { SCANNERS } from './data/scanners/registry'
import type {
  scanKey,
  computeSummary,
  severityRank,
  getSafeGrade,
  formatTimestamp,
  withScannerTimeout,
} from './data/scanners/utils'
import type { isKnownModuleByName } from './data/scanners/modules'
import type { getStrengthLevel, getStrengthColor } from './data/securityScoring'
import type { CHECK_DEFS } from './data/securityChecks'
import type { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import type { getCachedScan, setCachedScan } from './data/scanResultsCache'

export interface SecurityContract {
  // Scanner registry
  scanners: typeof SCANNERS
  // UI metadata lookup (labels, descriptions, CTA routes per check)
  checkDefs: typeof CHECK_DEFS
  // Pure utilities
  scanKey: typeof scanKey
  computeSummary: typeof computeSummary
  severityRank: typeof severityRank
  getSafeGrade: typeof getSafeGrade
  formatTimestamp: typeof formatTimestamp
  withScannerTimeout: typeof withScannerTimeout
  isKnownModuleByName: typeof isKnownModuleByName
  getStrengthLevel: typeof getStrengthLevel
  getStrengthColor: typeof getStrengthColor
  // Module-level scan-result cache accessors (the cache itself stays private)
  getCachedScan: typeof getCachedScan
  setCachedScan: typeof setCachedScan
  // Shared constants
  zeroAddress: typeof ZERO_ADDRESS
}
