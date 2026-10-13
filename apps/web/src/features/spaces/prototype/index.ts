import type { FeatureHandle } from '@/features/__core__'
import type implementation from './feature'

export const PendingQueuePrototype: FeatureHandle<typeof implementation> = {
  name: 'pending-queue-prototype',
  useIsEnabled: () => process.env.NEXT_PUBLIC_IS_PRODUCTION !== 'true',
  load: () => import('./feature'),
}
