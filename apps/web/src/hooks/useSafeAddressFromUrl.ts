import { useMemo } from 'react'
import { useRouter } from 'next/compat/router'
import { parse, type ParsedUrlQuery } from 'querystring'
import { parsePrefixedAddress } from '@safe-global/utils/utils/addresses'
import { useIsHydrated } from './useIsHydrated'

// Use location object directly because Next.js router.query is empty during SSG hydration
const getLocationQuery = (): ParsedUrlQuery => {
  if (typeof location === 'undefined') return {}
  return parse(location.search.slice(1))
}

/** Returns the raw `safe` query param (e.g. "sep:0xAbc…") with a location.search fallback for SSG hydration */
export const useSafeQueryParam = (): string => {
  const router = useRouter()
  const { safe = '' } = router?.query ?? {}
  return safe ? (Array.isArray(safe) ? safe[0] : safe) : getLocationQuery().safe?.toString() || ''
}

export const useSafeAddressFromUrl = (): string => {
  const fullAddress = useSafeQueryParam()

  const checksummedAddress = useMemo(() => {
    if (!fullAddress) return ''
    const { address } = parsePrefixedAddress(fullAddress)
    return address
  }, [fullAddress])

  return checksummedAddress
}

/**
 * Render-safe variant of {@link useSafeAddressFromUrl}: `''` during the prerender and on the first
 * client render, the real address afterwards.
 *
 * Reading `location.search` while rendering diverges from the build-time HTML (the app is a static
 * export), so anything that *branches the rendered output* on the URL safe address must use this —
 * otherwise React throws a hydration mismatch (#418) and regenerates the subtree.
 *
 * Do NOT use this for data fetching or effects: `useLoadSafeInfo` skips its CGW query on an empty
 * address and `useEffectiveSafeParams` exists precisely to start requests before Redux has the safe,
 * so both need the address on the very first render. Those keep using the ungated hooks above.
 */
export const useHydratedSafeAddressFromUrl = (): string => {
  const isHydrated = useIsHydrated()
  const address = useSafeAddressFromUrl()

  return isHydrated ? address : ''
}
