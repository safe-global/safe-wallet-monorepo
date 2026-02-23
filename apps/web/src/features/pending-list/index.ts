import type { FeatureHandle } from '@/features/__core__'
import type { PendingListContract } from './contract'

export const PendingListFeature: FeatureHandle<PendingListContract> = {
  name: 'pending-list',
  useIsEnabled: () => true,
  load: () => import('./feature'),
}
