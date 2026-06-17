import useChains from '@/hooks/useChains'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'

/**
 * Whether the workspace Billing page (route, nav entry, Plans section) should be visible.
 *
 * Billing is an account-wide concern, not a per-chain one, so visibility is derived from whether
 * GTF_PLANS or GTF is enabled on ANY configured chain — not the currently-selected network. This
 * keeps the tab stable as the user switches chains, instead of flickering in and out. Returns
 * `undefined` while the chain config is still loading so callers can avoid flickering the nav entry
 * or prematurely redirecting away from the page.
 */
const useIsBillingVisible = (): boolean | undefined => {
  const { configs, loading } = useChains()

  if (loading || configs.length === 0) return undefined

  return configs.some((chain) => hasFeature(chain, FEATURES.GTF_PLANS) || hasFeature(chain, FEATURES.GTF))
}

export default useIsBillingVisible
