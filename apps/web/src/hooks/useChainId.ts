import { useParams } from 'next/navigation'
import { parse, type ParsedUrlQuery } from 'querystring'
import { DEFAULT_CHAIN_ID } from '@/config/constants'
import chains from '@/config/chains'
import { parsePrefixedAddress } from '@safe-global/utils/utils/addresses'
import useWallet from './wallets/useWallet'
import useChains from './useChains'

// Use the location object directly because Next.js's router.query is available only on mount
const getLocationQuery = (): ParsedUrlQuery => {
  if (typeof location === 'undefined') return {}
  const query = parse(location.search.slice(1))
  return query
}

// Shared URL parsing: extracts the chain short name from query params
const useUrlShortName = (): string => {
  const queryParams = useParams()
  const query = queryParams && (queryParams.safe || queryParams.chain) ? queryParams : getLocationQuery()
  const chain = query.chain?.toString() || ''
  const safe = query.safe?.toString() || ''
  const { prefix } = parsePrefixedAddress(safe)
  return prefix || chain
}

// Static-only chainId from URL (no API wait)
// Enables optimistic early API calls before chains config loads
export const useRawUrlChainId = (): string => {
  const shortName = useUrlShortName()
  if (!shortName) return String(DEFAULT_CHAIN_ID)
  return chains[shortName] || String(DEFAULT_CHAIN_ID)
}

export const useUrlChainId = (): string | undefined => {
  const shortName = useUrlShortName()
  const { configs } = useChains()
  if (!shortName) return undefined
  return chains[shortName] || configs.find((item) => item.shortName === shortName)?.chainId
}

const useWalletChainId = (): string | undefined => {
  const wallet = useWallet()
  const { configs } = useChains()
  const walletChainId =
    wallet?.chainId && configs.some(({ chainId }) => chainId === wallet.chainId) ? wallet.chainId : undefined
  return walletChainId
}

const useChainId = (): string => {
  const urlChainId = useUrlChainId()
  const walletChainId = useWalletChainId()

  return urlChainId || walletChainId || String(DEFAULT_CHAIN_ID)
}

export default useChainId
