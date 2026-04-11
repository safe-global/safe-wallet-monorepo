import { IS_PRODUCTION } from '@/config/constants'
import type { SafeVersion } from '@safe-global/types-kit'

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

/** Minimum USD balance to recommend enterprise-grade protection. Mirrors hypernative's threshold. */
export const HIGH_VALUE_THRESHOLD_USD = IS_PRODUCTION ? 1_000_000 : 1

/** Safe versions to check against when validating deployment addresses. */
export const KNOWN_SAFE_VERSIONS: SafeVersion[] = ['1.0.0', '1.1.1', '1.2.0', '1.3.0', '1.4.1']
