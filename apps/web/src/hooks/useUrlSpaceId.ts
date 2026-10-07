import { useRouter } from 'next/compat/router'
import { parse } from 'querystring'
import { useIsHydrated } from './useIsHydrated'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
// Old links still carry a numeric id; the backend accepts it, but the Workspace list exposes only UUIDs
const LEGACY_ID_PATTERN = /^\d+$/

/** The raw `spaceId` of the page location, for code that has no router (e.g. store listeners). */
export const getLocationSpaceId = (): unknown => {
  if (typeof location === 'undefined') return undefined
  return parse(location.search.slice(1)).spaceId
}

/** A Workspace id, or null for a missing, repeated (`string[]`) or malformed value. */
export const parseSpaceId = (value: unknown): string | null =>
  typeof value === 'string' && (UUID_PATTERN.test(value) || LEGACY_ID_PATTERN.test(value)) ? value : null

/** True for a legacy numeric Workspace id, which cannot be matched against the Workspace list. */
export const isLegacySpaceId = (spaceId: string): boolean => LEGACY_ID_PATTERN.test(spaceId)

/** The `spaceId` URL param, or null. Not read from persisted state: all browser tabs share it. */
export const useUrlSpaceId = (): string | null => {
  // Like useSafeQueryParam: the compat router is null when no router is mounted
  const query = useRouter()?.query ?? {}
  // Like useSafeAddressFromUrl: the location differs from the build-time HTML until mount (React #418)
  const isHydrated = useIsHydrated()
  return parseSpaceId(query.spaceId ?? (isHydrated ? getLocationSpaceId() : undefined))
}

/**
 * Returns `query` with `spaceId` added as its last param. Accepts a raw value such as
 * `router.query.spaceId`; returns `query` unchanged when the value is not a valid Workspace id.
 */
export const withSpaceId = <Query extends object>(query: Query, spaceId: unknown): Query & { spaceId?: string } => {
  const id = parseSpaceId(spaceId)
  return id ? { ...query, spaceId: id } : query
}

/** {@link withSpaceId} for a URL string: appends `spaceId` to its query string. */
export const withSpaceIdInUrl = (url: string, spaceId: unknown): string => {
  const id = parseSpaceId(spaceId)
  if (!id) return url

  const [base, hash] = url.split('#', 2)
  const separator = base.includes('?') ? '&' : '?'
  return `${base}${separator}spaceId=${id}${hash === undefined ? '' : `#${hash}`}`
}
