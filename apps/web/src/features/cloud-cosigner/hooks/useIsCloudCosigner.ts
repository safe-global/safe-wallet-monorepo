import { useCloudCosignerInfo } from './useCloudCosignerInfo'
import { isCloudCosignerAddress } from '../utils/owners'

/** Whether `address` is the cloud cosigner, e.g. to label it in an owner list. */
export const useIsCloudCosigner = (address: string | undefined): boolean => {
  const { address: cosignerAddress } = useCloudCosignerInfo()
  return isCloudCosignerAddress(address, cosignerAddress)
}
