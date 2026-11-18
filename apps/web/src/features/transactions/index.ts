import type { FeatureHandle } from '@/features/__core__/types'
import type { TransactionsContract } from './contract'

export const TransactionsFeature: FeatureHandle<TransactionsContract> = {
  name: 'transactions',
  useIsEnabled: () => true,
  load: () => import('./feature'),
}
