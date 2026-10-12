import { useMemo } from 'react'
import { useRouter } from 'next/router'
import { parse } from 'querystring'
import { useIsHydrated } from './useIsHydrated'
import { useUrlSpaceId, withSpaceId } from './useUrlSpaceId'

export type SafeLinkQuery = { safe?: string | string[]; spaceId?: string }

const getLocationSafe = (): string | string[] | undefined =>
  typeof location === 'undefined' ? undefined : parse(location.search.slice(1)).safe

/** Query params for a link to the Safe of the current URL: its `safe` and, if present, its `spaceId`. */
export const useSafeLinkQuery = (): SafeLinkQuery => {
  const { safe: routerSafe } = useRouter().query
  // Like useUrlSpaceId: the router query stays empty until the router is ready, so read the location
  // once mounted; before that the location differs from the build-time HTML (React #418).
  const isHydrated = useIsHydrated()
  const safe = routerSafe ?? (isHydrated ? getLocationSafe() : undefined)
  const spaceId = useUrlSpaceId()

  return useMemo(() => withSpaceId(safe === undefined ? {} : { safe }, spaceId), [safe, spaceId])
}
