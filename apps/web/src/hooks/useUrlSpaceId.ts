import { useRouter } from 'next/router'
import { parse } from 'querystring'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Next.js router.query is empty during static-export hydration
const getLocationSpaceId = (): unknown => {
  if (typeof location === 'undefined') return undefined
  return parse(location.search.slice(1)).spaceId
}

/** A Workspace UUID, or null for a missing, repeated (`string[]`) or malformed value. */
export const parseSpaceId = (value: unknown): string | null =>
  typeof value === 'string' && UUID_PATTERN.test(value) ? value : null

/**
 * The Workspace of this tab: the `spaceId` query param, or null. It never falls back to stored
 * state, because that state is shared by all tabs.
 */
export const useUrlSpaceId = (): string | null => {
  const { query } = useRouter()
  return parseSpaceId(query.spaceId ?? getLocationSpaceId())
}
