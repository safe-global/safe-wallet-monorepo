import { FEATURES } from '@safe-global/utils/utils/chains'
import { useDefaultChainHasFeature } from '@/hooks/useDefaultChainHasFeature'

export const useIsWorkspaceWizardEnabled = (): boolean | undefined =>
  useDefaultChainHasFeature(FEATURES.WORKSPACE_ONBOARDING_V2)
