import { selectUndeployedSafe } from '@/features/counterfactual/store/undeployedSafesSlice'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import useSafeInfo from '@/hooks/useSafeInfo'
import { resetSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import { useAppSelector } from '@/store'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import { parsePrefixedAddress, sameAddress } from '@safe-global/utils/utils/addresses'

/**
 * Hook that resets the Safe SDK when dependencies change
 * The SDK will be lazily initialized when first needed
 * This hook should only be called in InitApp or similar top-level component
 */
export const useInitSafeCoreSDK = () => {
  const { safe, safeLoaded } = useSafeInfo()
  const web3ReadOnly = useWeb3ReadOnly()

  const { query } = useRouter()
  const prefixedAddress = Array.isArray(query.safe) ? query.safe[0] : query.safe
  const { address } = parsePrefixedAddress(prefixedAddress || '')
  const undeployedSafe = useAppSelector((state) => selectUndeployedSafe(state, safe.chainId, address))

  useEffect(() => {
    // Reset SDK when dependencies change or are invalid
    // The SDK will be lazily initialized when first accessed
    if (!safeLoaded || !web3ReadOnly || !sameAddress(address, safe.address.value)) {
      resetSafeSDK()
    } else {
      // Dependencies are valid but SDK might be stale from previous safe/chain
      // Reset it so it re-initializes with new parameters on next use
      resetSafeSDK()
    }
  }, [
    address,
    safe.address.value,
    safe.chainId,
    safe.implementation.value,
    safe.implementationVersionState,
    safe.version,
    safeLoaded,
    web3ReadOnly,
    undeployedSafe,
  ])
}
