import type { FeatureHandle } from '@/features/__core__'
import type { TxLinkContract } from './contract'

export type { TxLinkContract } from './contract'

export const TxLinkFeature: FeatureHandle<TxLinkContract> = {
  name: 'tx-link',
  useIsEnabled: () => true,
  load: () => import(/* webpackMode: "lazy" */ './feature') as Promise<{ default: TxLinkContract }>,
}
