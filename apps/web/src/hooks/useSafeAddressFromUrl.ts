import { useMemo } from 'react'
import { useRouter } from 'next/compat/router'
import { parse, type ParsedUrlQuery } from 'querystring'
import { parsePrefixedAddress } from '@safe-global/utils/utils/addresses'

// Use location object directly because Next.js router.query is empty during SSG hydration
const getLocationQuery = (): ParsedUrlQuery => {
  if (typeof location === 'undefined') return {}
  return parse(location.search.slice(1))
}

export const useSafeAddressFromUrl = (): string => {
  const router = useRouter()
  const { safe = '' } = router?.query ?? {}
  // Fall back to location.search when router.query is empty (SSG hydration)
  const fullAddress = safe ? (Array.isArray(safe) ? safe[0] : safe) : getLocationQuery().safe?.toString() || ''

  const checksummedAddress = useMemo(() => {
    if (!fullAddress) return ''
    const { address } = parsePrefixedAddress(fullAddress)
    return address
  }, [fullAddress])

  return checksummedAddress
}
