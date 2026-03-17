import type { ReactNode } from 'react'
import { Auth0Provider } from '@auth0/auth0-react'
import { AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_AUDIENCE, isAuth0Configured } from '../../config/auth0'
import Auth0TokenExchangeHandler from '../Auth0TokenExchangeHandler'

/**
 * Auth0Provider wrapper for _app.tsx.
 *
 * Mounts unconditionally when env vars are present.
 * Feature flag controls UI visibility only, not provider mounting.
 * This avoids a race condition where Auth0 redirect callback
 * arrives before chain config loads.
 *
 * Imported directly in _app.tsx (same pattern as HnQueueAssessmentProvider).
 */
export function Auth0ProviderWrapper({ children }: { children: ReactNode }) {
  if (!isAuth0Configured) {
    return <>{children}</>
  }

  return (
    <Auth0Provider
      domain={AUTH0_DOMAIN}
      clientId={AUTH0_CLIENT_ID}
      cacheLocation="memory"
      authorizationParams={{
        redirect_uri: typeof window !== 'undefined' ? window.location.href : '',
        audience: AUTH0_AUDIENCE,
      }}
    >
      <Auth0TokenExchangeHandler>{children}</Auth0TokenExchangeHandler>
    </Auth0Provider>
  )
}
