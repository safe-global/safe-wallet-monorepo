import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'

/**
 * Whether the CGW can quote Safe-pays fees on this chain. `/fees/{safe}/preview` requires a
 * RELAY_FEE relayer and rejects every request without one ("Accessing fee preview is only
 * available for chains with RELAY_FEE relayer"), regardless of gas token or payload.
 *
 * A chain can carry the GTF feature flag while previews are impossible —
 * the fee section still renders, but as signer-pays with a free execution
 * fee, and the preview endpoint must never be called.
 */
export const isGtfFeePreviewAvailable = (chain: Chain | undefined): boolean =>
  !!chain && hasFeature(chain, FEATURES.GTF) && chain.relayer?.type === 'RELAY_FEE'
