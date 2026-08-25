export const GTF_FEES_BANNER_DISMISSED_KEY = 'gtfFeesBannerDismissed'

// flip to `true` to restore the Safe-pays UI and signing once relaying ships.
export const IS_RELAYING_LIVE = false

// Re-exported from @safe-global/utils so web and mobile validate against the same allowlist.
export { FEE_COLLECTORS } from '@safe-global/utils/features/gtf/constants'

export * from './gasTokenAllowlist'
