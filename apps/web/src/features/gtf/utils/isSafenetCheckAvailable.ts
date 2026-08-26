import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'

/**
 * Whether the user may opt into a Safenet check on this chain. The feature gates
 * availability only — the check itself is off unless the user asks for it per transaction.
 */
export const isSafenetCheckAvailable = (chain: Chain | undefined): boolean =>
  !!chain && hasFeature(chain, FEATURES.SAFENET_CHECKS)
