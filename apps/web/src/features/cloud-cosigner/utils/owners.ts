import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { NamedAddress } from '@/components/new-safe/create/types'
import { CLOUD_COSIGNER_NAME } from '../constants'

export const isCloudCosignerAddress = (address: string | undefined, cosignerAddress: string | undefined): boolean =>
  !!address && !!cosignerAddress && sameAddress(address, cosignerAddress)

export const hasCloudCosigner = (owners: NamedAddress[], cosignerAddress: string | undefined): boolean =>
  owners.some((owner) => isCloudCosignerAddress(owner.address, cosignerAddress))

export const toCosignerOwner = (cosignerAddress: string): NamedAddress => ({
  name: CLOUD_COSIGNER_NAME,
  address: cosignerAddress,
})

/**
 * Adds the cosigner as an extra owner and raises the threshold by one, so the existing signers'
 * quorum is unchanged and the cosigner is always one of the required confirmations.
 */
export const addCloudCosigner = (
  owners: NamedAddress[],
  threshold: number,
  cosignerAddress: string,
): { owners: NamedAddress[]; threshold: number } => {
  if (hasCloudCosigner(owners, cosignerAddress)) {
    return { owners, threshold }
  }
  return { owners: [...owners, toCosignerOwner(cosignerAddress)], threshold: threshold + 1 }
}

/**
 * Removes the cosigner owner and lowers the threshold by one, never below one.
 */
export const removeCloudCosigner = (
  owners: NamedAddress[],
  threshold: number,
  cosignerAddress: string,
): { owners: NamedAddress[]; threshold: number } => {
  if (!hasCloudCosigner(owners, cosignerAddress)) {
    return { owners, threshold }
  }
  const remaining = owners.filter((owner) => !isCloudCosignerAddress(owner.address, cosignerAddress))
  return { owners: remaining, threshold: Math.min(Math.max(threshold - 1, 1), remaining.length) }
}
