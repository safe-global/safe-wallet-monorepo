import { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

export const getSafeSigners = (SafeInfo: SafeOverview, signers: Record<string, AddressInfo>) => {
  const owners = SafeInfo.owners.map((owner) => owner.value)
  return owners.filter((owner) => signers[owner])
}
