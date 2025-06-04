import { useCallback } from 'react'
import { useAppSelector } from '../store/hooks'
import { RootState } from '../store'
import { selectSigners } from '../store/signersSlice'
import { selectSafeInfo } from '../store/safesSlice'
import { getAccountType } from '@/src/utils/notifications/accountType'

export function useNotificationGTWPermissions(safeAddress: string, chainId?: string) {
  const appSigners = useAppSelector(selectSigners)

  const activeSafeInfo = useAppSelector((state: RootState) => selectSafeInfo(state, safeAddress as `0x${string}`))

  const safe = chainId ? activeSafeInfo?.[chainId] : undefined

  const getAccountTypeFn = useCallback(() => getAccountType(safe, appSigners), [safe, appSigners])

  return { getAccountType: getAccountTypeFn }
}
