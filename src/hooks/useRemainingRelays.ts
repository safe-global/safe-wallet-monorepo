import useAsync from '@/hooks/useAsync'
import useSafeInfo from './useSafeInfo'
import { FEATURES, hasFeature } from '@/utils/chains'
import { useCurrentChain } from '@/hooks/useChains'
import { getRelayCount, RelayCountResponse } from '@safe-global/safe-gateway-typescript-sdk'
import { useAppSelector } from '@/store'
import { selectSuperChainAccount } from '@/store/superChainAccountSlice'
import { getWeeklyRelayedTransactions } from '@/services/superchain-accounts/sponsor'
import { Address } from 'viem'

export const MAX_WEEKLY_RELAYS = 3

export const useRelaysBySafe = () => {
  const { safeAddress } = useSafeInfo()
  const superChainSmartAccount = useAppSelector(selectSuperChainAccount)
  return useAsync<RelayCountResponse>(() => {
    if (superChainSmartAccount.data) {
      return new Promise((resolve) => {
        resolve({
          remaining:
            Number(superChainSmartAccount.data.weeklyRelayedTransactions.maxRelayedTransactions) -
            Number(superChainSmartAccount.data.weeklyRelayedTransactions.relayedTransactions),
          limit: Number(superChainSmartAccount.data.weeklyRelayedTransactions.maxRelayedTransactions),
        } as RelayCountResponse)
      })
    } else {
      if (!safeAddress) return
      return (async () => {
        const weeklyRelayedTransactions = await getWeeklyRelayedTransactions(safeAddress as Address)
        return {
          remaining:
            Number(weeklyRelayedTransactions.data.maxRelayedTransactions) -
            Number(weeklyRelayedTransactions.data.relayedTransactions),
          limit: Number(weeklyRelayedTransactions.data.maxRelayedTransactions),
        } as RelayCountResponse
      })()
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeAddress, superChainSmartAccount])
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
        return { remaining: 0, limit: MAX_WEEKLY_RELAYS }
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chain, ownerAddresses, safe.txHistoryTag])
}
