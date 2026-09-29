import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectIsStoreHydrated, setLandingSpaceHint } from '@/store/authSlice'
import { useUrlSpaceId } from '@/hooks/useUrlSpaceId'

/**
 * Stores the Workspace of the URL while this tab is visible, so that `/spaces` without a spaceId
 * opens the Workspace of the last active tab.
 */
export const useRememberSpace = (): void => {
  const dispatch = useAppDispatch()
  const isStoreHydrated = useAppSelector(selectIsStoreHydrated)
  const spaceId = useUrlSpaceId()

  useEffect(() => {
    // Before hydration, the persisted state would overwrite the value
    if (!isStoreHydrated || !spaceId) return

    const rememberIfVisible = () => {
      if (document.visibilityState === 'visible') dispatch(setLandingSpaceHint(spaceId))
    }

    rememberIfVisible()
    document.addEventListener('visibilitychange', rememberIfVisible)
    return () => document.removeEventListener('visibilitychange', rememberIfVisible)
  }, [dispatch, isStoreHydrated, spaceId])
}
