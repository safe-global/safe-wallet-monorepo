import { useMemo } from 'react'
import { useAppSelector } from '@/store'
import { useHasFeature } from '@/hooks/useChains'
import useWallet from '@/hooks/wallets/useWallet'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type { SimilarityMatch } from '@safe-global/utils/utils/addressSimilarity.types'
import { selectAnchorIndex, selectIsSimilarAddressDismissed } from '../store'

/**
 * Mode A: returns the trusted anchor that the given address dangerously resembles
 * (but is not), or null. Gated by the ADDRESS_POISONING_PROTECTION chain flag and by
 * per-account "I've vetted this address" dismissals.
 */
const useAddressSimilarity = (address?: string): SimilarityMatch | null => {
  const isEnabled = useHasFeature(FEATURES.ADDRESS_POISONING_PROTECTION)
  const anchorIndex = useAppSelector(selectAnchorIndex)
  const account = useWallet()?.address ?? ''
  const isDismissed = useAppSelector((state) =>
    address ? selectIsSimilarAddressDismissed(state, account, address) : false,
  )

  return useMemo(() => {
    if (!isEnabled || !address || isDismissed) {
      return null
    }
    return anchorIndex.query(address)
  }, [isEnabled, address, isDismissed, anchorIndex])
}

export default useAddressSimilarity
