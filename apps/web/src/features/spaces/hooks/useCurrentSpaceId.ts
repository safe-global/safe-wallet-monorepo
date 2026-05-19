import { useRouter } from 'next/router'

/**
 * Returns the current space ID from the URL `spaceId` query param.
 * The URL is the single source of truth — useSpaceIdSync keeps it populated
 * for signed-in users. Returns null until the URL is populated.
 */
export const useCurrentSpaceId = (): string | null => {
  const { query } = useRouter()
  const rawSpaceId = query.spaceId
  return typeof rawSpaceId === 'string' && rawSpaceId.length > 0 ? rawSpaceId : null
}
