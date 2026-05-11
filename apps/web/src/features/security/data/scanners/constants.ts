import { IS_PRODUCTION } from '@/config/constants'
import type { SafeVersion } from '@safe-global/types-kit'
import type { SecurityGrade } from '../securityTypes'

/** Maximum time a single scanner is allowed to run before being rejected. */
export const SCANNER_TIMEOUT_MS = 15_000

/** Minimum USD balance to recommend enterprise-grade protection. Mirrors hypernative's threshold. */
export const HIGH_VALUE_THRESHOLD_USD = IS_PRODUCTION ? 1_000_000 : 1

/** Safe versions to check against when validating deployment addresses. */
export const KNOWN_SAFE_VERSIONS: SafeVersion[] = ['1.0.0', '1.1.1', '1.2.0', '1.3.0', '1.4.1']

/** Sort order for severities — lower number ranks first (worst issues bubble to top). */
export const SEVERITY_RANK: Record<SecurityGrade, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
}
