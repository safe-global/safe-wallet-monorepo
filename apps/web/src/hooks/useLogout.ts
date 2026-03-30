import { useCallback } from 'react'
import { useAuthLogoutWithRedirectV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/auth'
import { useAppDispatch } from '@/store'
import { setUnauthenticated } from '@/store/authSlice'
import { AppRoutes } from '@/config/routes'
import { logError, Errors } from '@/services/exceptions'

const useLogout = () => {
  const [authLogoutWithRedirect] = useAuthLogoutWithRedirectV1Mutation()
  const dispatch = useAppDispatch()

  const logout = useCallback(async () => {
    try {
      const redirectUrl = new URL(AppRoutes.welcome.spaces, window.location.origin).toString()
      await authLogoutWithRedirect({
        logoutDto: { redirect_url: redirectUrl },
      })
      dispatch(setUnauthenticated())
    } catch (error) {
      logError(Errors._109, error)
    }
  }, [authLogoutWithRedirect, dispatch])

  return { logout }
}

export default useLogout
