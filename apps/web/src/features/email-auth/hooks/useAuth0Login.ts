import { useContext } from 'react'
import { Auth0Context } from '@auth0/auth0-react'

/**
 * Hook for Auth0 email login UI state.
 *
 * - Safe to call without Auth0Provider (returns no-op defaults when context is absent).
 * - Token exchange is handled by useAuth0TokenExchange in Auth0ProviderWrapper.
 * - Returns Auth0 loading/auth state for UI guards.
 */
export function useAuth0Login() {
  const context = useContext(Auth0Context)

  const isAuthenticated = context?.isAuthenticated ?? false
  const isLoading = context?.isLoading ?? false
  const logout = context?.logout

  return { isAuthenticated, isLoading, logout }
}
