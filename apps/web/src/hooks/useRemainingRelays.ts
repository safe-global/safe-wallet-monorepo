import useAsync from '@/hooks/useAsync'
import useSafeInfo from './useSafeInfo'
import { useCurrentChain } from '@/hooks/useChains'
import { getRelayCount } from '@safe-global/safe-gateway-typescript-sdk'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'

export const MAX_DAY_RELAYS = 5

export const useRelaysBySafe = () => {
  const chain = useCurrentChain()
  const { safe, safeAddress } = useSafeInfo()

  return useAsync(() => {
    if (!safeAddress || !chain) return
    if (hasFeature(chain, FEATURES.RELAYING)) {
      return getRelayCount(chain.chainId, safeAddress)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chain, safeAddress, safe.txHistoryTag])
}

export const useLeastRemainingRelays = (ownerAddresses: string[]) => {
  const chain = useCurrentChain()
  const { safe } = useSafeInfo()

  return useAsync(() => {
    if (!chain || !hasFeature(chain, FEATURES.RELAYING)) return

    return Promise.all(ownerAddresses.map((address) => getRelayCount(chain.chainId, address)))
      .then((result) => {
        const min = Math.min(...result.map((r) => r.remaining))
        return result.find((r) => r.remaining === min)
      })
      .catch(() => {
        return { remaining: 0, limit: MAX_DAY_RELAYS }
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chain, ownerAddresses, safe.txHistoryTag])
}
