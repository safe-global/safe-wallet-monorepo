import { useMemo } from 'react'
import { useTokenListSetting } from '@/hooks/loadables/useLoadBalances'
import useAsync from '@/hooks/useAsync'
import useWallet from '@/hooks/wallets/useWallet'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import { type SafeOverview, getSafeOverviews } from '@safe-global/safe-gateway-typescript-sdk'

const _cache: Record<string, SafeOverview[]> = {}

type SafeParams = {
  address: string
  chainId: string
}

// EIP155 address format
const makeSafeId = ({ chainId, address }: SafeParams) => `${chainId}:${address}` as `${number}:0x${string}`

function useSafeOverviews(safes: Array<SafeParams>) {
  const excludeSpam = useTokenListSetting() || false
  const currency = useAppSelector(selectCurrency)
  const wallet = useWallet()
  const walletAddress = wallet?.address
  const safesStrings = useMemo(() => safes.map(makeSafeId), [safes])

  const [data, error, isLoading] = useAsync(async () => {
    return await getSafeOverviews(safesStrings, {
      trusted: true,
      exclude_spam: excludeSpam,
      currency,
      wallet_address: walletAddress,
    })
  }, [safesStrings, excludeSpam, currency, walletAddress])

  const cacheKey = safesStrings.join()
  const result = data ?? _cache[cacheKey]

  // Cache until the next page load
  _cache[cacheKey] = result

  return useMemo(() => [result, error, isLoading], [result, error, isLoading])
}

export default useSafeOverviews
