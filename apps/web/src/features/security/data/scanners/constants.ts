import { IS_PRODUCTION } from '@/config/constants'

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

/** Minimum USD balance to recommend enterprise-grade protection. Mirrors hypernative's threshold. */
export const HIGH_VALUE_THRESHOLD_USD = IS_PRODUCTION ? 1_000_000 : 1
