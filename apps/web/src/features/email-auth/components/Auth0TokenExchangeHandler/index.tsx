import type { ReactNode } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useAuth0TokenExchange } from '../../hooks/useAuth0TokenExchange'

/**
 * Runs the Auth0 → CGW token exchange.
 * Must be rendered inside Auth0Provider to access Auth0 context.
 */
function Auth0TokenExchangeHandler({ children }: { children: ReactNode }) {
  const { isAuthenticated, getIdTokenClaims } = useAuth0()
  useAuth0TokenExchange(isAuthenticated, getIdTokenClaims)
  return <>{children}</>
}

export default Auth0TokenExchangeHandler
