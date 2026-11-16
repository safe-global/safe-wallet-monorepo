import type { FeatureHandle } from '@/features/__core__'
import type { SpacesContract } from './contract'

// Core feature: always enabled, not gated by a CGW feature flag.
export const SpacesFeature: FeatureHandle<SpacesContract> = {
  name: 'spaces',
  useIsEnabled: () => true,
  load: () => import(/* webpackMode: "lazy" */ './feature') as Promise<{ default: SpacesContract }>,
}
