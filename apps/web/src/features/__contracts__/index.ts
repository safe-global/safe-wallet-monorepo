export type {
  FeatureHandle,
  FeatureImplementation,
  FeatureContract,
  // Individual capability contracts
  ComponentContract,
  HooksContract,
  ServicesContract,
  SelectorsContract,
  // Type helpers
  ExtractComponentProps,
  ExtractHookReturn,
  ExtractSelectorReturn,
  // Deprecated
  BaseFeatureContract,
} from './types'

export { withSuspense } from './withSuspense'
export { useLoadFeature, clearFeatureCache } from './useLoadFeature'
