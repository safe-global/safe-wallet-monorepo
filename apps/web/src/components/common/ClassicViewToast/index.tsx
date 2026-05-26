import { useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useAppDispatch, useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useIsClassicViewActive, disableClassicView } from '@/hooks/useClassicView'
import { closeByGroupKey, showNotification } from '@/store/notificationsSlice'
import { AppRoutes } from '@/config/routes'

export const CLASSIC_VIEW_TOAST_GROUP_KEY = 'classic-view-deprecation'
export const CLASSIC_VIEW_TOAST_MESSAGE =
  'Classic view will be deprecated soon. Make sure to log in and create a workspace.'
export const CLASSIC_VIEW_TOAST_LINK_TITLE = 'Log in'

/**
 * Renderless side-effect component: when a logged-out user is using the
 * classic-view escape hatch, raise a warning toast once. The toast's link
 * clears the opt-in so the require-login gate takes over again.
 */
const ClassicViewToast = () => {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const isClassicViewActive = useIsClassicViewActive()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const shouldShow = isClassicViewActive && !isUserSignedIn
  const wasShownRef = useRef(false)

  useEffect(() => {
    if (!shouldShow) {
      if (wasShownRef.current) {
        dispatch(closeByGroupKey({ groupKey: CLASSIC_VIEW_TOAST_GROUP_KEY }))
        wasShownRef.current = false
      }
      return
    }

    if (wasShownRef.current) return
    wasShownRef.current = true

    dispatch(
      showNotification({
        message: CLASSIC_VIEW_TOAST_MESSAGE,
        variant: 'warning',
        groupKey: CLASSIC_VIEW_TOAST_GROUP_KEY,
        link: {
          onClick: () => {
            disableClassicView()
            router.push(AppRoutes.welcome.spaces)
          },
          title: CLASSIC_VIEW_TOAST_LINK_TITLE,
        },
      }),
    )
  }, [dispatch, router, shouldShow])

  return null
}

export default ClassicViewToast
