import type { FeatureImplementation } from '@/features/__core__'
import type SafenetAuditRow from './components/SafenetAuditRow'
import type SafenetChecksSection from './components/SafenetChecksSection'
import type SafenetQueueStatus from './components/SafenetQueueStatus'
import type SafenetCardCaption from './prototype/components/SafenetCardCaption'
import type SafenetHistoryRow from './prototype/components/SafenetHistoryRow'
import type SafenetQueueChip from './prototype/components/SafenetQueueChip'
import type SafenetScenarioDialog from './prototype/components/SafenetScenarioDialog'
import type SafenetShieldRow from './prototype/components/SafenetShieldRow'
import type SafenetTxStatus from './prototype/components/SafenetTxStatus'

/**
 * Lazy-loaded surface of the Safenet checks feature. All are PascalCase
 * components (stubs render null until the feature is loaded and enabled):
 * `SafenetAuditRow` is the check's step in the transaction audit log,
 * `SafenetQueueStatus` is the compact per-row state in the queue,
 * `SafenetChecksSection` is the check's section in the Safe Shield widget
 * during confirm/execute flows.
 */
export interface SafenetChecksContract extends FeatureImplementation {
  SafenetAuditRow: typeof SafenetAuditRow
  SafenetChecksSection: typeof SafenetChecksSection
  SafenetQueueStatus: typeof SafenetQueueStatus
}

/**
 * Lazy-loaded surface of the mocked M1 prototype, gated by `SAFENET_CHECKS_PROTOTYPE`. While the
 * flag is on these replace the real Safenet surfaces and add the action note and tx details status.
 */
export interface SafenetChecksPrototypeContract extends FeatureImplementation {
  SafenetCardCaption: typeof SafenetCardCaption
  SafenetHistoryRow: typeof SafenetHistoryRow
  SafenetQueueChip: typeof SafenetQueueChip
  SafenetScenarioDialog: typeof SafenetScenarioDialog
  SafenetShieldRow: typeof SafenetShieldRow
  SafenetTxStatus: typeof SafenetTxStatus
}

export type { SafenetCheckPhase } from './prototype/types'
