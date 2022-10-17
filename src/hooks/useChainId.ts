import { useRouter } from 'next/router'
import { parse, type ParsedUrlQuery } from 'querystring'
import { IS_PRODUCTION } from '@/config/constants'
import chains from '@/config/chains'
import { useAppSelector } from '@/store'
import { selectSession } from '@/store/sessionSlice'
import { parsePrefixedAddress } from '@/utils/addresses'

const defaultChainId = IS_PRODUCTION ? chains.eth : chains.gor

// Use the location object directly because Next.js's router.query is available only in an effect
const getLocationQuery = (): ParsedUrlQuery => {
  if (typeof location === 'undefined') return {}

  const query = parse(location.search.slice(1))

  if (!query.safe) {
    const prefixedAddressRe = /[a-z0-9-]+\:0x[a-f0-9]{40}/i
    const pathParam = location.pathname.split('/')[1]
    const safeParam = prefixedAddressRe.test(pathParam) ? pathParam : ''

    // Path param -> query param
    if (prefixedAddressRe.test(pathParam)) {
      query.safe = safeParam
    }
  }

  return query
}

export const useUrlChainId = (): string | undefined => {
  const router = useRouter()
  // Dynamic query params are available only in an effect
  const query = router.query.safe || router.query.chain ? router.query : getLocationQuery()
  const chain = query.chain?.toString() || ''
  const safe = query.safe?.toString() || ''

  const { prefix } = parsePrefixedAddress(safe)
  const shortName = prefix || chain

  if (shortName) {
    const chainId = Object.entries(chains).find(([key]) => key === shortName)?.[1]
    if (chainId == null) {
      throw Error('Invalid chain short name in the URL')
    }
    return chainId
  }
}

export const useChainId = (): string => {
  const session = useAppSelector(selectSession)
  const urlChainId = useUrlChainId()
  return urlChainId || session.lastChainId || defaultChainId
}

export default useChainId
