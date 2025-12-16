import { useMemo } from 'react'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import useAsync from '@safe-global/utils/hooks/useAsync'
import useSafeInfo from './useSafeInfo'
import { useCurrentChain } from '@/hooks/useChains'
import {
  useRelayGetRelaysRemainingV1Query,
  useLazyRelayGetRelaysRemainingV1Query,
  type RelaysRemaining,
} from '@safe-global/store/gateway/AUTO_GENERATED/relay'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'

export const MAX_DAY_RELAYS = 5

export const useRelaysBySafe = (): AsyncResult<RelaysRemaining> => {
  const chain = useCurrentChain()
  const { safeAddress } = useSafeInfo()

  const { data, error, isLoading } = useRelayGetRelaysRemainingV1Query(
    { chainId: chain?.chainId || '', safeAddress: safeAddress || '' },
    {
      skip: !safeAddress || !chain || !hasFeature(chain, FEATURES.RELAYING),
    },
  )

  const convertedError = useMemo(() => {
    if (!error) return undefined
    return new Error('message' in error ? String(error.message) : 'Failed to fetch relay count')
  }, [error])

  return [data, convertedError, isLoading]
}

export const useLeastRemainingRelays = (ownerAddresses: string[]): AsyncResult<RelaysRemaining> => {
  const chain = useCurrentChain()
  const { safe } = useSafeInfo()
  const [trigger] = useLazyRelayGetRelaysRemainingV1Query()

  return useAsync(() => {
    if (!chain || !hasFeature(chain, FEATURES.RELAYING)) return

    return Promise.all(
      ownerAddresses.map((address) => trigger({ chainId: chain.chainId, safeAddress: address }).unwrap()),
    )
      .then((result) => {
        const min = Math.min(...result.map((r) => r.remaining))
        return result.find((r) => r.remaining === min)
      })
      .catch(() => {
        return { remaining: 0, limit: MAX_DAY_RELAYS }
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chain, ownerAddresses, safe.txHistoryTag, trigger])
}
