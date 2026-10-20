import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import type { AllowlistEligibility } from '../types'
import { getPolicyGuardAddress, isSafeVersionSupported } from './policyEngineDeployments'

export const isAllowlistEnabled = (chain: Pick<Chain, 'chainId' | 'features'>): boolean =>
  hasFeature(chain, FEATURES.POLICY_RECIPIENT_ALLOWLIST) && !!getPolicyGuardAddress(chain.chainId)

export const isSafeEligibleForAllowlist = (
  safe: { version?: string | null; deployed?: boolean },
  chain: Pick<Chain, 'chainId' | 'features'> | undefined,
): AllowlistEligibility => {
  if (!chain || !isAllowlistEnabled(chain)) return { eligible: false, reason: 'chain-not-enabled' }
  if (safe.deployed === false) return { eligible: false, reason: 'safe-not-deployed' }
  if (!isSafeVersionSupported(safe.version)) return { eligible: false, reason: 'version-unsupported' }
  return { eligible: true }
}
