import { useContext } from 'react'
import { Auth0Context } from '@auth0/auth0-react'
import { isAuth0Configured } from '../config/auth0'

/**
 * Hook for Auth0 email login UI state.
 *
 * - Returns inert defaults when Auth0 env vars are absent.
 *   Auth0Context always has a non-undefined default (with isLoading: true),
 *   so we must gate on isAuth0Configured to avoid a permanent loading state.
 * - Token exchange is handled by useAuth0TokenExchange in Auth0ProviderWrapper.
 */
export function useAuth0Login() {
  const context = useContext(Auth0Context)

  if (!isAuth0Configured) {
    return { isAuthenticated: false, isLoading: false, logout: undefined }
  }

  return {
    isAuthenticated: context.isAuthenticated,
    isLoading: context.isLoading,
    logout: context.logout,
  }
}
