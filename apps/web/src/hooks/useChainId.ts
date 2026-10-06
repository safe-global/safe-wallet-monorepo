import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import { parse, type ParsedUrlQuery } from 'querystring'
import { DEFAULT_CHAIN_ID } from '@/config/constants'
import chains from '@safe-global/utils/config/chains'
import { parsePrefixedAddress } from '@safe-global/utils/utils/addresses'
import { useSafeScope } from '@/components/tx-flow/safe-scope/context'
import useWallet from './wallets/useWallet'
import useChains from './useChains'

// Use the location object directly because Next.js's router.query is available only on mount
const getLocationQuery = (): ParsedUrlQuery => {
  if (typeof location === 'undefined') return {}
  const query = parse(location.search.slice(1))
  return query
}

// `absent` and `unknown` stay distinct because only `absent` may fall back to a default chain.
export type UrlChain =
  | { status: 'absent' }
  | { status: 'pending'; shortName: string }
  | { status: 'unknown'; shortName: string }
  | { status: 'resolved'; chainId: string }

export const useUrlChain = (): UrlChain => {
  const queryParams = useParams()
  const { configs } = useChains()

  // Dynamic query params
  const query = queryParams && (queryParams.safe || queryParams.chain) ? queryParams : getLocationQuery()
  const chain = query.chain?.toString() || ''
  const safe = query.safe?.toString() || ''

  const { prefix } = parsePrefixedAddress(safe)
  const shortName = prefix || chain

  const chainId = shortName
    ? chains[shortName] || configs.find((item) => item.shortName === shortName)?.chainId
    : undefined
  const hasConfigs = configs.length > 0

  return useMemo(() => {
    if (!shortName) return { status: 'absent' }
    if (chainId) return { status: 'resolved', chainId }
    // The static EIP-3770 list misses chains only the runtime config knows.
    return hasConfigs ? { status: 'unknown', shortName } : { status: 'pending', shortName }
  }, [shortName, chainId, hasConfigs])
}

const useWalletChainId = (): string | undefined => {
  const wallet = useWallet()
  const { configs } = useChains()
  const walletChainId =
    wallet?.chainId && configs.some(({ chainId }) => chainId === wallet.chainId) ? wallet.chainId : undefined
  return walletChainId
}

const useChainId = (): string => {
  const scope = useSafeScope()
  const urlChain = useUrlChain()
  const walletChainId = useWalletChainId()

  if (scope?.chainId) return scope.chainId
  if (urlChain.status === 'resolved') return urlChain.chainId
  // A default here would query the wrong chain for the Safe in the URL; '' makes consumers skip.
  if (urlChain.status !== 'absent') return ''

  return walletChainId || String(DEFAULT_CHAIN_ID)
}

export default useChainId
