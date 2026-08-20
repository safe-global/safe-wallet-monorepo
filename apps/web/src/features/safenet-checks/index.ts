import type { FeatureHandle } from '@/features/__core__'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type { SafenetChecksContract } from './types'

/**
 * Feature gate: the CGW `SAFENET_CHECKS` flag. For local testing use the
 * "Feature flags" override panel in the sidebar.
 */
export const useIsSafenetChecksEnabled = (): boolean => useHasFeature(FEATURES.SAFENET_CHECKS) === true

export const SafenetChecksFeature: FeatureHandle<SafenetChecksContract> = {
  name: 'safenet-checks',
  useIsEnabled: useIsSafenetChecksEnabled,
  load: () => import(/* webpackMode: "lazy" */ './feature') as Promise<{ default: SafenetChecksContract }>,
}

export type { SafenetChecksContract } from './types'
