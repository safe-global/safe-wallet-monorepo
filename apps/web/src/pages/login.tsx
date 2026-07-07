import { useEffect } from 'react'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'

/**
 * Auth0 Application Login URI (initiate_login_uri) target.
 *
 * Auth0 redirects here — with an `iss` query param per the OIDC Third-Party
 * Initiated Login spec — whenever it can't continue a flow itself (stale or
 * bookmarked login page, expired transaction, browser Back after login,
 * disabled cookies). This route renders nothing; it drops the Auth0 params and
 * forwards to /welcome/spaces, which shows the workspace list when authenticated
 * or the login picker when signed out.
 */
const LoginPage: NextPage = () => {
  const router = useRouter()

  useEffect(() => {
    if (!router.isReady || router.pathname !== AppRoutes.login) return
    router.replace(AppRoutes.welcome.spaces)
  }, [router])

  return null
}

export default LoginPage
