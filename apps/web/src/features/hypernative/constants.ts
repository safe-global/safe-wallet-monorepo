import {
  IS_PRODUCTION,
  PROD_HYPERNATIVE_ALLOWLIST_OUTREACH_ID,
  PROD_HYPERNATIVE_OUTREACH_ID,
  STAGING_HYPERNATIVE_ALLOWLIST_OUTREACH_ID,
  STAGING_HYPERNATIVE_OUTREACH_ID,
} from '@/config/constants'
import { cgwDebugStorage } from '@/config/gateway'
/**
 * Outreach ID for Hypernative banner targeting.
 * This ID corresponds to a separate targeting list managed by the backend.
 * Hypernative banners are shown when the user's Safe is included in the targeted messaging campaign.
 * Switches between production and staging IDs based on environment or the debugProdCgw flag.
 */
export const HYPERNATIVE_OUTREACH_ID =
  IS_PRODUCTION || cgwDebugStorage.get() ? PROD_HYPERNATIVE_OUTREACH_ID : STAGING_HYPERNATIVE_OUTREACH_ID

/**
 * Outreach ID for Hypernative allowlist CTA targeting.
 * Uses a dedicated outreach ID to target Safes eligible for login CTA exposure.
 */
export const HYPERNATIVE_ALLOWLIST_OUTREACH_ID =
  IS_PRODUCTION || cgwDebugStorage.get()
    ? PROD_HYPERNATIVE_ALLOWLIST_OUTREACH_ID
    : STAGING_HYPERNATIVE_ALLOWLIST_OUTREACH_ID
