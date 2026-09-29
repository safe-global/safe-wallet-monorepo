import { useMemo } from 'react'
import { useRouter } from 'next/compat/router'
import type { NextRouter } from 'next/router'
import { parse } from 'querystring'
import { useIsHydrated } from './useIsHydrated'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
// Old links still carry a numeric id; the backend accepts it, but the Workspace list exposes only UUIDs
const LEGACY_ID_PATTERN = /^\d+$/

// Next.js router.query is empty during static-export hydration
const getLocationSpaceId = (): unknown => {
  if (typeof location === 'undefined') return undefined
  return parse(location.search.slice(1)).spaceId
}

/** A Workspace id, or null for a missing, repeated (`string[]`) or malformed value. */
export const parseSpaceId = (value: unknown): string | null =>
  typeof value === 'string' && (UUID_PATTERN.test(value) || LEGACY_ID_PATTERN.test(value)) ? value : null

/** True for a legacy numeric Workspace id, which cannot be matched against the Workspace list. */
export const isLegacySpaceId = (spaceId: string): boolean => LEGACY_ID_PATTERN.test(spaceId)

/**
 * The Workspace of this tab: the `spaceId` query param, or null. It never falls back to stored
 * state, because that state is shared by all tabs.
 */
export const useUrlSpaceId = (): string | null => {
  // Like useSafeQueryParam: the compat router is null when no router is mounted
  const query = useRouter()?.query ?? {}
  // Like useSafeAddressFromUrl: the location differs from the build-time HTML until mount (React #418)
  const isHydrated = useIsHydrated()
  return parseSpaceId(query.spaceId ?? (isHydrated ? getLocationSpaceId() : undefined))
}

export type SpaceIdQuery = { spaceId?: string }

/** Spread into a link `query` to keep the link in the Workspace; empty outside a Workspace. */
export const getSpaceIdQuery = (spaceId: string | null): SpaceIdQuery => (spaceId ? { spaceId } : {})

/** `&spaceId=…` for a link built as a string, after its `?safe=` param; empty outside a Workspace. */
export const getSpaceIdSearchParam = (spaceId?: string | null): string => (spaceId ? `&spaceId=${spaceId}` : '')

/** The {@link getSpaceIdQuery} of the page location, for code that has no router (e.g. store listeners). */
export const getLocationSpaceIdQuery = (): SpaceIdQuery => getSpaceIdQuery(parseSpaceId(getLocationSpaceId()))

/** The {@link getSpaceIdQuery} of a router, for code that runs outside a component. */
export const getRouterSpaceIdQuery = (router: Pick<NextRouter, 'query'>): SpaceIdQuery =>
  getSpaceIdQuery(parseSpaceId(router.query?.spaceId))

/** The {@link getSpaceIdQuery} of this tab. */
export const useSpaceIdQuery = (): SpaceIdQuery => {
  const spaceId = useUrlSpaceId()
  return useMemo(() => getSpaceIdQuery(spaceId), [spaceId])
}
