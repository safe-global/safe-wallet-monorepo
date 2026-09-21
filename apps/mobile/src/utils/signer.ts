import { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

export const getSafeSigners = (safeInfo: SafeOverview, signers: Record<string, AddressInfo>) => {
  const signerAddresses = new Set(Object.keys(signers).map((address) => address.toLowerCase()))
  return safeInfo.owners.map((owner) => owner.value).filter((owner) => signerAddresses.has(owner.toLowerCase()))
}
