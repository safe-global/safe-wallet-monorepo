import { createFeatureHandle } from '@/features/__core__'
import type { CloudCosignerContract } from './contract'

export const CloudCosignerFeature = createFeatureHandle<CloudCosignerContract>('cloud-cosigner')

export type { CloudCosignerContract } from './contract'
export type { CloudCosignerOptionProps } from './components/CloudCosignerOption'
export { useCloudCosignerInfo } from './hooks/useCloudCosignerInfo'
export { useIsCloudCosigner } from './hooks/useIsCloudCosigner'
export { useCloudCosignerSafeStatus } from './hooks/useCloudCosignerSafeStatus'
export {
  addCloudCosigner,
  removeCloudCosigner,
  hasCloudCosigner,
  isCloudCosignerAddress,
  toCosignerOwner,
} from './utils/owners'
export { CLOUD_COSIGNER_NAME } from './constants'
