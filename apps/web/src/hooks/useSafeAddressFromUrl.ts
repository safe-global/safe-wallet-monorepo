import { useMemo } from 'react'
import { useRouter } from 'next/compat/router'
import { parse, type ParsedUrlQuery } from 'querystring'
import { parsePrefixedAddress } from '@safe-global/utils/utils/addresses'

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
