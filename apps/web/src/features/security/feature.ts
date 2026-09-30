/**
 * Security Feature Implementation - LAZY LOADED
 *
 * This file is lazy-loaded via createFeatureHandle — do NOT use lazy() inside.
 *
 * IMPORTANT: Hooks are NOT included here — they're exported directly from index.ts
 * to avoid Rules of Hooks violations. Only services (camelCase) belong here.
 *
 * UPPER_SNAKE_CASE imports are aliased to camelCase so useLoadFeature's proxy
 * correctly stubs them as `undefined` (service) rather than `() => null` (component).
 */
import type { SecurityContract } from './contract'

import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { SCANNERS } from './data/scanners/registry'
import { CHECK_DEFS } from './data/securityChecks'
import {
  scanKey,
  computeSummary,
  severityRank,
  getSafeGrade,
  formatTimestamp,
  withScannerTimeout,
} from './data/scanners/utils'
import { getScoreBand } from './data/scoreBands'
import { isKnownModuleByName } from './data/scanners/modules'
import { getCachedScan, setCachedScan } from './data/scanResultsCache'

const feature: SecurityContract = {
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

export default feature
