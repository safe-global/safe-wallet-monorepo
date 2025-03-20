import { useCallback } from 'react'
import { useAppSelector } from '../store/hooks'
import { useDefinedActiveSafe } from '../store/hooks/activeSafe'
import { RootState } from '../store'
import { selectSigners } from '../store/signersSlice'
import { NOTIFICATION_ACCOUNT_TYPE } from '../store/constants'
import { selectSafeInfo } from '../store/safesSlice'

export function useNotificationGTWPermissions() {
  const appSigners = useAppSelector(selectSigners)
  const activeSafe = useDefinedActiveSafe()
  const activeSafeInfo = useAppSelector((state: RootState) => selectSafeInfo(state, activeSafe.address))
  const owners = activeSafeInfo.SafeInfo.owners

  const getAccountType = useCallback(() => {
    const ownerFound = activeSafeInfo.SafeInfo.owners.find((owner) => appSigners[owner.value]) ?? null
    const accountType = ownerFound ? NOTIFICATION_ACCOUNT_TYPE.OWNER : NOTIFICATION_ACCOUNT_TYPE.REGULAR
    return { ownerFound, accountType }
  }, [owners, appSigners])

  return { getAccountType }
}
