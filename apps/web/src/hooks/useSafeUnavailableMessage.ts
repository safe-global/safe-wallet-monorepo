import { useSafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { getSafeUnavailableMessage } from '@/utils/rtkQuery'
import useChainId from './useChainId'
import { useSafeAddressFromUrl } from './useSafeAddressFromUrl'

/**
 * Copy for a blocked Safe (`451 Unavailable for legal reasons`), or `undefined` for any other
 * outcome. Reads the same cache entry as `useLoadSafeInfo`, so it issues no request of its own.
 */
const useSafeUnavailableMessage = (): string | undefined => {
  const chainId = useChainId()
  const address = useSafeAddressFromUrl()

  const { unavailableMessage } = useSafesGetSafeV1Query(
    { chainId: chainId || '', safeAddress: address || '' },
    {
      skip: !chainId || !address,
      selectFromResult: ({ error }) => ({ unavailableMessage: getSafeUnavailableMessage(error) }),
    },
  )

  return unavailableMessage
}

export default useSafeUnavailableMessage
