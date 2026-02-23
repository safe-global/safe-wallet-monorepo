import type { FeatureHandle } from '@/features/__core__'
import type { AssetsListContract } from './contract'

export const AssetsListFeature: FeatureHandle<AssetsListContract> = {
  name: 'assets-list',
  useIsEnabled: () => true,
  load: () => import('./feature'),
}
