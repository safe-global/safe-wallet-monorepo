import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import { useSpaceSafesGetV1Query, useSpacesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
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
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useUrlChainId } from '@/hooks/useChainId'
import { useSafeAddressFromUrl } from '@/hooks/useSafeAddressFromUrl'
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
  // Chain flags are kill switches: set to true → feature OFF; unset/false/undefined → feature ON.
  const requireLogin = useHasDefaultChainFeature(FEATURES.DISABLE_SPACES_LOGIN) !== true
  const classicEnabled = useHasDefaultChainFeature(FEATURES.DISABLE_CLASSIC_UI) !== true
  const { data: spaces, isError: spacesError } = useSpacesGetV1Query(undefined, { skip: !isSignedIn })

  // Only check membership when there's both a Safe in the URL and a last-used space.
  // Skipped when not signed in, no last space, or no current safe — caller should treat
  // an undefined result as "no information".
  const urlChainId = useUrlChainId()
  const urlSafeAddress = useSafeAddressFromUrl()
  const skipSafeCheck = !isSignedIn || !lastUsedSpaceId || !urlChainId || !urlSafeAddress
  const { currentData: lastSpaceSafes } = useSpaceSafesGetV1Query(
    { spaceId: Number(lastUsedSpaceId) },
    { skip: skipSafeCheck },
  )

  const lastUsedSpaceContainsCurrentSafe = useMemo<boolean | undefined>(() => {
    if (skipSafeCheck || !lastSpaceSafes) return undefined
    const addresses = lastSpaceSafes.safes[urlChainId] ?? []
    return addresses.some((a) => sameAddress(a, urlSafeAddress))
  }, [skipSafeCheck, lastSpaceSafes, urlChainId, urlSafeAddress])

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
      lastUsedSpaceContainsCurrentSafe,
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
    lastUsedSpaceContainsCurrentSafe,
    requireLogin,
    classicEnabled,
    spaces,
    spacesError,
  ])
}
