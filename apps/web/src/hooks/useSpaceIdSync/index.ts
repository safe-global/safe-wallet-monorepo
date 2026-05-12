import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSpacesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useAppSelector } from '@/store'
import { isAuthenticated, selectIsOidcLoginPending } from '@/store/authSlice'
import { useHasDefaultChainFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { AppRoutes } from '@/config/routes'
import { decide } from './decide'

const getQuerySpaceId = (query: Record<string, string | string[] | undefined>): string | null => {
  const raw = query.spaceId
  return typeof raw === 'string' && raw.length > 0 ? raw : null
}

/**
 * Keeps `?spaceId` in sync with auth state across the whole app.
 * See docs/superpowers/specs/2026-05-12-spaceid-url-as-source-of-truth-design.md
 * for the behavior matrix. Mount once in InitApp.
 */
export const useSpaceIdSync = (): void => {
  const router = useRouter()
  const isSignedIn = useAppSelector(isAuthenticated)
  const isOidcPending = useAppSelector(selectIsOidcLoginPending)
  const requireLogin = useHasDefaultChainFeature(FEATURES.REQUIRE_SPACES_LOGIN)
  const classicEnabled = useHasDefaultChainFeature(FEATURES.CLASSIC_UI_ENABLED)
  const { data: spaces, isError: spacesError } = useSpacesGetV1Query(undefined, { skip: !isSignedIn })

  useEffect(() => {
    if (!router.isReady) return

    const decision = decide({
      requireLogin,
      classicEnabled,
      isSignedIn,
      isOidcPending,
      pathname: router.pathname,
      asPath: router.asPath,
      querySpaceId: getQuerySpaceId(router.query),
      userSpaceIds: spaces ? spaces.map((s) => String(s.id)) : undefined,
      spacesError,
    })

    switch (decision.action) {
      case 'noop':
        return
      case 'inject':
      case 'overwrite':
        router.replace(
          { pathname: router.pathname, query: { ...router.query, spaceId: decision.spaceId } },
          undefined,
          { shallow: true },
        )
        return
      case 'forceOnboarding':
        router.replace({ pathname: AppRoutes.spaces.index })
        return
      case 'bounceToSignIn':
        router.replace({
          pathname: AppRoutes.welcome.spaces,
          query: { redirect: decision.redirect },
        })
        return
    }
  }, [router, isSignedIn, isOidcPending, requireLogin, classicEnabled, spaces, spacesError])
}
