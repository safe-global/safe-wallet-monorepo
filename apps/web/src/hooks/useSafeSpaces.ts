import { useEffect, useState } from 'react'
import {
  useSpacesGetV1Query,
  useLazySpaceSafesGetV1Query,
  type GetSpaceResponse,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'

/** Maps a chain-qualified Safe key (`${chainId}:${lowercased address}`) to the Spaces (workspaces) it belongs to. */
export type SafeSpacesMap = Record<string, GetSpaceResponse[]>

/** Chain-qualified key for the reverse lookup. Matches the accounts table's row keys. */
const safeSpaceKey = (chainId: string, address: string) => `${chainId}:${address.toLowerCase()}`

/**
 * Builds a reverse lookup from a chain-qualified Safe key to the Spaces it belongs to.
 *
 * The gateway only exposes space → safes, so this fetches the signed-in user's spaces and
 * each space's safes, then indexes them by `${chainId}:${address}`. Keying by chain (not
 * address alone) keeps a Safe that shares an address across chains from inheriting another
 * chain's workspace membership. Signed-out users belong to no space, so the map is empty and
 * the "Workspaces" column simply renders nothing.
 *
 * Lives in shared hooks (not the spaces feature) so cross-feature consumers like the
 * accounts table can use it without importing the heavy `@/features/spaces` barrel,
 * which would form a circular dependency.
 */
export const useSafeSpaces = (): { safeSpaces: SafeSpacesMap; isLoading: boolean } => {
  const isSignedIn = useAppSelector(isAuthenticated)
  const { data: spaces, isLoading: isLoadingSpaces } = useSpacesGetV1Query(undefined, { skip: !isSignedIn })
  const [triggerSpaceSafes] = useLazySpaceSafesGetV1Query()
  const [safeSpaces, setSafeSpaces] = useState<SafeSpacesMap>({})
  const [isResolving, setIsResolving] = useState(false)

  useEffect(() => {
    if (!spaces || spaces.length === 0) {
      setSafeSpaces({})
      setIsResolving(false)
      return
    }

    let cancelled = false
    setIsResolving(true)

    Promise.all(
      spaces.map((space) =>
        triggerSpaceSafes({ spaceId: space.uuid }, true)
          .unwrap()
          .then((response) => ({ space, safes: response.safes }))
          .catch(() => null),
      ),
    ).then((results) => {
      if (cancelled) return

      const nextMap: SafeSpacesMap = {}
      for (const result of results) {
        if (!result) continue
        const seen = new Set<string>()
        for (const chainId in result.safes) {
          for (const address of result.safes[chainId]) {
            const key = safeSpaceKey(chainId, address)
            if (seen.has(key)) continue
            seen.add(key)
            ;(nextMap[key] ??= []).push(result.space)
          }
        }
      }

      setSafeSpaces(nextMap)
      setIsResolving(false)
    })

    return () => {
      cancelled = true
    }
  }, [spaces, triggerSpaceSafes])

  return { safeSpaces, isLoading: isLoadingSpaces || isResolving }
}
