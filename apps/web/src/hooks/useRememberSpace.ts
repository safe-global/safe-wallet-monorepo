import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectIsStoreHydrated, setLandingSpaceHint } from '@/store/authSlice'
import { isLegacySpaceId, useUrlSpaceId } from '@/hooks/useUrlSpaceId'

/**
 * Saves the `spaceId` URL param as the landing hint while the page is visible, so `/spaces`
 * without an id opens the Workspace that the user saw last.
 */
export const useRememberSpace = (): void => {
  const dispatch = useAppDispatch()
  const isStoreHydrated = useAppSelector(selectIsStoreHydrated)
  const spaceId = useUrlSpaceId()

  useEffect(() => {
    // Before hydration, the persisted state would overwrite the value. A legacy id matches no
    // Workspace in the list, so keep the previous hint instead.
    if (!isStoreHydrated || !spaceId || isLegacySpaceId(spaceId)) return

    const rememberIfVisible = () => {
      if (document.visibilityState === 'visible') dispatch(setLandingSpaceHint(spaceId))
    }

    rememberIfVisible()
    document.addEventListener('visibilitychange', rememberIfVisible)
    return () => document.removeEventListener('visibilitychange', rememberIfVisible)
  }, [dispatch, isStoreHydrated, spaceId])
}
