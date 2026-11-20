import { useMemo } from 'react'
import { useRouter } from 'next/router'
import { parse } from 'querystring'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope/context'
import { useIsHydrated } from './useIsHydrated'
import { useUrlSpaceId, withSpaceId } from './useUrlSpaceId'

export type SafeLinkQuery = { safe?: string | string[]; spaceId?: string }

const getLocationSafe = (): string | string[] | undefined =>
  typeof location === 'undefined' ? undefined : parse(location.search.slice(1)).safe

/**
 * Query params for a link to the current Safe: its `safe` and, if present, its `spaceId`. The current Safe
 * is the one a Space-level flow is scoped to, otherwise the Safe of the URL.
 */
export const useSafeLinkQuery = (): SafeLinkQuery => {
  const { safe: routerSafe } = useRouter().query
  // Like useUrlSpaceId: the router query stays empty until the router is ready, so read the location
  // once mounted; before that the location differs from the build-time HTML (React #418).
  const isHydrated = useIsHydrated()
  const urlSafe = routerSafe ?? (isHydrated ? getLocationSafe() : undefined)
  const spaceId = useUrlSpaceId()

  // Under a scope the URL Safe is absent or another one, so link to no Safe until the chain resolves
  const scope = useSafeScope()
  const scopeShortName = scope?.chain?.shortName
  const scopedSafe = scope && scopeShortName ? `${scopeShortName}:${scope.safeAddress}` : undefined
  const safe = scope ? scopedSafe : urlSafe

  return useMemo(() => withSpaceId(safe === undefined ? {} : { safe }, spaceId), [safe, spaceId])
}
