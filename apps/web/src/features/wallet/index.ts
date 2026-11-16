import type { FeatureHandle } from '@/features/__core__/types'
import type { WalletContract } from './contract'

export const WalletFeature: FeatureHandle<WalletContract> = {
  name: 'wallet',
  useIsEnabled: () => true,
  load: () => import(/* webpackMode: "lazy" */ './feature') as Promise<{ default: WalletContract }>,
}

export type * from './types'
