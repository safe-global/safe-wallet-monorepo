import { useCallback } from 'react'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'

import useChainId from '@/hooks/useChainId'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectOpened, markOpened } from '@/store/safeAppsSlice'

type ReturnType = {
  openedSafeAppIds: Array<SafeAppData['id']>
  markSafeAppOpened: (id: SafeAppData['id']) => void
}

// Return the ids of Safe Apps previously opened by the user
export const useOpenedSafeApps = (): ReturnType => {
  const chainId = useChainId()

  const dispatch = useAppDispatch()
  const openedSafeAppIds = useAppSelector((state) => selectOpened(state, chainId))

  const markSafeAppOpened = useCallback(
    (id: SafeAppData['id']) => {
      dispatch(markOpened({ id, chainId }))
    },
    [dispatch, chainId],
  )

  return { openedSafeAppIds, markSafeAppOpened }
}
