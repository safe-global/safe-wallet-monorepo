import { useRouter } from 'next/router'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useSpacesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

/**
 * Returns the current space ID from the URL `spaceId` query param, falling back
 * to the user's first space if the URL has not yet been populated by useSpaceIdSync.
 * The URL is the single source of truth.
 */
export const useCurrentSpaceId = (): string | null => {
  const { query } = useRouter()
  const isSiweAuthenticated = useAppSelector(isAuthenticated)
  const { data: spaces } = useSpacesGetV1Query(undefined, { skip: !isSiweAuthenticated })

  const rawSpaceId = query.spaceId
  const querySpaceId = typeof rawSpaceId === 'string' && rawSpaceId.length > 0 ? rawSpaceId : null
  const firstSpaceId = spaces?.[0] ? String(spaces[0].id) : null

  return querySpaceId || firstSpaceId
}
