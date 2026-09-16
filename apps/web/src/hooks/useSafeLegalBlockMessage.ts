import { useSafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { getLegalUnavailabilityMessage } from '@/utils/rtkQuery'
import useChainId from './useChainId'
import { useSafeAddressFromUrl } from './useSafeAddressFromUrl'

/**
 * The backend's reason for blocking the current Safe (`451 Unavailable for legal reasons`),
 * or `undefined` for any other outcome. Reads the same cache entry as `useLoadSafeInfo`,
 * so it issues no request of its own.
 */
const useSafeLegalBlockMessage = (): string | undefined => {
  const chainId = useChainId()
  const address = useSafeAddressFromUrl()

  const { legalBlockMessage } = useSafesGetSafeV1Query(
    { chainId: chainId || '', safeAddress: address || '' },
    {
      skip: !chainId || !address,
      selectFromResult: ({ error }) => ({ legalBlockMessage: getLegalUnavailabilityMessage(error) }),
    },
  )

  return legalBlockMessage
}

export default useSafeLegalBlockMessage
