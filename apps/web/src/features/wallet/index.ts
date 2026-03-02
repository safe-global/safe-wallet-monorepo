import type { FeatureHandle } from '@/features/__core__/types'
import type { WalletContract } from './contract'

export const WalletFeature: FeatureHandle<WalletContract> = {
  name: 'wallet',
  useIsEnabled: () => true,
  load: () => import(/* webpackMode: "lazy" */ './feature') as Promise<{ default: WalletContract }>,
}

export { default as useWalletPopover } from './hooks/useWalletPopover'

export type * from './types'
