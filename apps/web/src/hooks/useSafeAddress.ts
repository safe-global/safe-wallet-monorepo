import { useMemo } from 'react'
import { useRouter } from 'next/router'
import { parse, type ParsedUrlQuery } from 'querystring'
import { parsePrefixedAddress } from '@/utils/addresses'

// Use the location object directly because Next.js's router.query is available only on mount
const getLocationQuery = (): ParsedUrlQuery => {
  if (typeof location === 'undefined') return {}
  const query = parse(location.search.slice(1))
  return query
}

export const useUrlSafeAddress = (useLocation?: boolean): string | undefined => {
  const router = useRouter()
  const query = router.query && router.query?.safe ? router.query : useLocation ? getLocationQuery() : router.query
  const safe = query.safe?.toString() || ''
  return safe
}

const useSafeAddress = (useLocation?: boolean): string => {
  const fullAddress = useUrlSafeAddress(useLocation)

  const checksummedAddress = useMemo(() => {
    if (!fullAddress) return ''
    const { address } = parsePrefixedAddress(fullAddress)
    return address
  }, [fullAddress])

  return checksummedAddress
}

export default useSafeAddress
