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
 * `''` until mounted, then the address. Use it wherever the *rendered output* branches on the URL
 * safe address: the app is a static export, so reading it on the first render diverges from the
 * build-time HTML and throws React #418.
 *
 * Not for data fetching — `useLoadSafeInfo` and `useEffectiveSafeParams` need the address on the
 * first render and keep using {@link useSafeAddressFromUrl}.
 */
export const useHydratedSafeAddressFromUrl = (): string => {
  const isHydrated = useIsHydrated()
  const address = useSafeAddressFromUrl()

  return isHydrated ? address : ''
}
