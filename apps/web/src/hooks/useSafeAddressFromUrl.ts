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

/**
 * The checksummed URL safe address, `''` until mounted. The app is a static export, so reading the
 * address on the first render diverges from the build-time HTML — anything branching its output on
 * it would throw React #418. The later swap is an ordinary React update.
 *
 * Data fetching pays one render pass for this. Use {@link useSafeQueryParam} to read the raw param
 * without the gate.
 */
export const useSafeAddressFromUrl = (): string => {
  const isHydrated = useIsHydrated()
  const fullAddress = useSafeQueryParam()

  const checksummedAddress = useMemo(() => {
    if (!fullAddress) return ''
    const { address } = parsePrefixedAddress(fullAddress)
    return address
  }, [fullAddress])

  return isHydrated ? checksummedAddress : ''
}
