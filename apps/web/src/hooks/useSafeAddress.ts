import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import { parse, type ParsedUrlQuery } from 'querystring'
import { parsePrefixedAddress } from '@/utils/addresses'

// Use the location object directly because Next.js's router.query is available only on mount
const getLocationQuery = (): ParsedUrlQuery => {
  if (typeof location === 'undefined') return {}
  const query = parse(location.search.slice(1))
  return query
}

export const useUrlSafeAddress = (): string | undefined => {
  const queryParams = useParams()
  const query = queryParams && queryParams.safe ? queryParams : getLocationQuery()
  const safe = query.safe?.toString() || ''
  return safe
}

const useSafeAddress = (): string => {
  const fullAddress = useUrlSafeAddress()

  const checksummedAddress = useMemo(() => {
    if (!fullAddress) return ''
    const { address } = parsePrefixedAddress(fullAddress)
    return address
  }, [fullAddress])

  return checksummedAddress
}

export default useSafeAddress
