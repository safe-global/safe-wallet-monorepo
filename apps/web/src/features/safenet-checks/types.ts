import type { ComponentType } from 'react'
import type { FeatureImplementation } from '@/features/__core__'
import type SafenetAuditRow from './components/SafenetAuditRow'
import type SafenetChecksSection from './components/SafenetChecksSection'
import type { SafenetDevProposeProps } from './components/SafenetDevPropose'
import type SafenetQueueStatus from './components/SafenetQueueStatus'

/**
 * Lazy-loaded surface of the Safenet checks feature. All are PascalCase
 * components (stubs render null until the feature is loaded and enabled):
 * `SafenetAuditRow` is the check's step in the transaction audit log,
 * `SafenetQueueStatus` is the compact per-row state in the queue,
 * `SafenetChecksSection` is the check's section in the Safe Shield widget
 * during confirm/execute flows, and `SafenetDevPropose` is a dev-only control
 * that proposes a check from the connected wallet (null in production builds).
 */
export interface SafenetChecksContract extends FeatureImplementation {
  SafenetAuditRow: typeof SafenetAuditRow
  SafenetChecksSection: typeof SafenetChecksSection
  SafenetDevPropose: ComponentType<SafenetDevProposeProps>
  SafenetQueueStatus: typeof SafenetQueueStatus
}
