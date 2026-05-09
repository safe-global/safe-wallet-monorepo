import { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { NOTIFICATION_ACCOUNT_TYPE } from '@/src/store/constants'

export const getAccountType = (safeInfo: SafeOverview | undefined, signers: Record<string, AddressInfo>) => {
  if (!safeInfo) {
    return { ownerFound: null, accountType: NOTIFICATION_ACCOUNT_TYPE.REGULAR }
  }

  const ownerFound = safeInfo.owners.find((owner) => signers[owner.value]) ?? null

  return {
    ownerFound,
    accountType: ownerFound ? NOTIFICATION_ACCOUNT_TYPE.OWNER : NOTIFICATION_ACCOUNT_TYPE.REGULAR,
  }
}
