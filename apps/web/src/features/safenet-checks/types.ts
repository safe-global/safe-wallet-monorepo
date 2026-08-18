import type { FeatureImplementation } from '@/features/__core__'
import type SafenetAuditRow from './components/SafenetAuditRow'

/**
 * Lazy-loaded surface of the Safenet checks feature. All are PascalCase
 * components (stubs render null until the feature is loaded and enabled):
 * `SafenetAuditRow` is the check's step in the transaction audit log (status
 * + attestation link, PRD history design).
 */
export interface SafenetChecksContract extends FeatureImplementation {
  SafenetAuditRow: typeof SafenetAuditRow
}
