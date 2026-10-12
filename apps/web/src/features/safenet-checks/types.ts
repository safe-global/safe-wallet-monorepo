import type { FeatureImplementation } from '@/features/__core__'
import type SafenetAuditRow from './components/SafenetAuditRow'
import type SafenetChecksSection from './components/SafenetChecksSection'

/**
 * Lazy-loaded surface of the Safenet checks feature. All are PascalCase
 * components (stubs render null until the feature is loaded and enabled):
 * `SafenetAuditRow` is the check's step in the transaction audit log,
 * `SafenetChecksSection` is the check's section in the Safe Shield widget
 * during confirm/execute flows.
 */
export interface SafenetChecksContract extends FeatureImplementation {
  SafenetAuditRow: typeof SafenetAuditRow
  SafenetChecksSection: typeof SafenetChecksSection
}
