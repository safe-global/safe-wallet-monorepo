import type { FeatureHandle } from '@/features/__core__/types'
import type { AssetsContract } from './contract'

export const AssetsFeature: FeatureHandle<AssetsContract> = {
  name: 'assets',
  useIsEnabled: () => true,
  load: () => import('./feature'),
}
