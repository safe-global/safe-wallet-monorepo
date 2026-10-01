import type { FeatureHandle } from '@/features/__core__'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type { SafenetChecksContract, SafenetChecksPrototypeContract } from './types'
import { useIsSafenetPrototypeEnabled } from './useIsSafenetPrototypeEnabled'

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

/** Mocked M1 prototype; while on, its components replace the real ones at every mount site. */
export const SafenetChecksPrototypeFeature: FeatureHandle<SafenetChecksPrototypeContract> = {
  name: 'safenet-checks-prototype',
  useIsEnabled: useIsSafenetPrototypeEnabled,
  load: () =>
    import(/* webpackMode: "lazy" */ './prototype/feature') as Promise<{ default: SafenetChecksPrototypeContract }>,
}

export { useIsSafenetPrototypeEnabled }
export { useSafenetScenario } from './prototype/useSafenetScenario'
export type { SafenetChecksContract, SafenetChecksPrototypeContract } from './types'
export { withSafenetCheck } from './prototype/shieldSummary'
