import { useCallback } from 'react'
import { useAppSelector } from '../store/hooks'
import { RootState } from '../store'
import { selectSigners } from '../store/signersSlice'
import { NOTIFICATION_ACCOUNT_TYPE } from '../store/constants'
import { selectSafeInfo } from '../store/safesSlice'

export function useNotificationGTWPermissions(safeAddress: string, chainId?: string) {
  const appSigners = useAppSelector(selectSigners)

  const activeSafeInfo = useAppSelector((state: RootState) => selectSafeInfo(state, safeAddress as `0x${string}`))

  const safe = chainId ? activeSafeInfo?.[chainId] : activeSafeInfo ? Object.values(activeSafeInfo)[0] : undefined

  if (!safe) {
    return {
      getAccountType: () => ({ ownerFound: null, accountType: NOTIFICATION_ACCOUNT_TYPE.REGULAR }),
    }
  }

  const owners = safe.owners

  const getAccountType = useCallback(() => {
    const ownerFound = safe.owners.find((owner) => appSigners[owner.value]) ?? null
    const accountType = ownerFound ? NOTIFICATION_ACCOUNT_TYPE.OWNER : NOTIFICATION_ACCOUNT_TYPE.REGULAR
    return { ownerFound, accountType }
  }, [owners, appSigners])

  return { getAccountType }
}
