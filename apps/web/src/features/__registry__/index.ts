export {
  FeatureRegistryProvider,
  useFeatureRegistry,
  useFeature,
  useHasFeature,
  useRegisterFeature,
  useAllFeatures,
} from './FeatureRegistry'

// Test utilities - only import in test files
export {
  MockFeatureRegistrar,
  createFeatureTestWrapper,
  createMockFeatureContract,
  createDisabledFeatureContract,
  createLoadingFeatureContract,
} from './testUtils'
