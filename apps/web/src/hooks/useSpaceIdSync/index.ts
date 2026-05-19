import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSpacesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useAppDispatch, useAppSelector } from '@/store'
import {
  isAuthenticated,
  selectIsOidcLoginPending,
  selectIsStoreHydrated,
  selectLastUsedSpace,
  setLastUsedSpace,
} from '@/store/authSlice'
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
  const { isReady, pathname, asPath, query, replace } = router
  const dispatch = useAppDispatch()
  const isSignedIn = useAppSelector(isAuthenticated)
  const isOidcPending = useAppSelector(selectIsOidcLoginPending)
  const isStoreHydrated = useAppSelector(selectIsStoreHydrated)
  const lastUsedSpaceId = useAppSelector(selectLastUsedSpace)
  const requireLogin = useHasDefaultChainFeature(FEATURES.REQUIRE_SPACES_LOGIN)
  const classicEnabled = useHasDefaultChainFeature(FEATURES.CLASSIC_UI_ENABLED)
  const { data: spaces, isError: spacesError } = useSpacesGetV1Query(undefined, { skip: !isSignedIn })

  useEffect(() => {
    if (!isReady) return
    // Wait for redux-persist to rehydrate the session before deciding anything —
    // otherwise an actually signed-in user can be bounced to /welcome/spaces on
    // first render (where they then get stuck because /welcome/* is excluded).
    if (!isStoreHydrated) return

    const querySpaceId = getQuerySpaceId(query)

    // Remember the active space whenever the URL exposes a valid one, so that
    // subsequent navigations that strip ?spaceId can restore the same context
    // instead of falling back to the user's first owned space.
    if (querySpaceId && querySpaceId !== lastUsedSpaceId) {
      dispatch(setLastUsedSpace(querySpaceId))
    }

    const decision = decide({
      requireLogin,
      classicEnabled,
      isSignedIn,
      isOidcPending,
      pathname,
      asPath,
      querySpaceId,
      lastUsedSpaceId,
      userSpaceIds: spaces ? spaces.map((s) => String(s.id)) : undefined,
      spacesError,
    })

    switch (decision.action) {
      case 'noop':
        return
      case 'inject':
      case 'overwrite':
        replace({ pathname, query: { ...query, spaceId: decision.spaceId } }, undefined, { shallow: true })
        return
      case 'forceOnboarding':
        replace({ pathname: AppRoutes.spaces.index })
        return
      case 'bounceToSignIn':
        replace({
          pathname: AppRoutes.welcome.spaces,
          query: { redirect: decision.redirect },
        })
        return
    }
  }, [
    isReady,
    pathname,
    asPath,
    query,
    replace,
    dispatch,
    isSignedIn,
    isOidcPending,
    isStoreHydrated,
    lastUsedSpaceId,
    requireLogin,
    classicEnabled,
    spaces,
    spacesError,
  ])
}
