import { useRouter } from 'next/router'
import { useAppSelector } from '@/store'
import { isAuthenticated, lastUsedSpace } from '@/store/authSlice'
import { useSpacesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

/**
 * Returns the current space UUID by checking (in priority order):
 * 1. `spaceId` query param (UUID)
 * 2. Last used space stored in Redux
 * 3. First space from the user's spaces list
 */
export const useCurrentSpaceId = (): string | null => {
  const { query } = useRouter()
  const storedSpaceId = useAppSelector(lastUsedSpace)
  const isSiweAuthenticated = useAppSelector(isAuthenticated)

  const { data: spaces } = useSpacesGetV1Query(undefined, { skip: !isSiweAuthenticated })

  const rawSpaceId = query.spaceId
  const querySpaceId = typeof rawSpaceId === 'string' && rawSpaceId.length > 0 ? rawSpaceId : null
  const firstSpaceId = spaces?.[0]?.uuid ?? null

  return querySpaceId || storedSpaceId || firstSpaceId
}
