import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import { useChain } from '@/hooks/useChains'
import { DEFAULT_CHAIN_ID } from '@/config/constants'

/** The onboarding runs before a chain is picked, so the flag comes from the default chain; undefined while it loads. */
export const useIsWorkspaceWizardEnabled = (): boolean | undefined => {
  const chain = useChain(String(DEFAULT_CHAIN_ID))
  if (!chain) return undefined
  return hasFeature(chain, FEATURES.WORKSPACE_ONBOARDING_V2)
}
