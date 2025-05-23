import { useCallback } from 'react'
import { useAppSelector } from '../store/hooks'
import { RootState } from '../store'
import { selectSigners } from '../store/signersSlice'
import { selectSafeInfo } from '../store/safesSlice'
import { getAccountType } from '@/src/utils/notifications/accountType'

export function useNotificationGTWPermissions(safeAddress: string) {
  const appSigners = useAppSelector(selectSigners)

  const activeSafeInfo = useAppSelector((state: RootState) => selectSafeInfo(state, safeAddress as `0x${string}`))

  const getAccountTypeFn = useCallback(
    () => getAccountType(activeSafeInfo?.SafeInfo, appSigners),
    [activeSafeInfo?.SafeInfo, appSigners],
  )

  return { getAccountType: getAccountTypeFn }
}
