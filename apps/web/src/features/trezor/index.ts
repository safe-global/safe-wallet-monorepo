import type { FeatureHandle } from '@/features/__core__'
import type { TrezorContract } from './contract'

// Trezor is a core feature - always enabled, not gated by a CGW feature flag.
// We still use the feature architecture for lazy loading and code organization.
export const TrezorFeature: FeatureHandle<TrezorContract> = {
  name: 'trezor',
  useIsEnabled: () => true,
  load: () => import(/* webpackMode: "lazy" */ './feature') as Promise<{ default: TrezorContract }>,
}

export type { TransactionHash, TrezorHashState, ShowHashFunction, HideHashFunction } from './types'
export { showTrezorHashComparison, hideTrezorHashComparison } from './store'
