import useChains from '@/hooks/useChains'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'

/**
 * Whether Billing is visible: enabled if GTF_PLANS or GTF is on ANY chain (account-wide, not per-network,
 * so it stays stable across chain switches). `undefined` while chains load, so callers avoid flicker.
 */
const useIsBillingVisible = (): boolean | undefined => {
  const { configs, loading } = useChains()

  if (loading || configs.length === 0) return undefined

  return configs.some((chain) => hasFeature(chain, FEATURES.GTF_PLANS) || hasFeature(chain, FEATURES.GTF))
}

export default useIsBillingVisible
