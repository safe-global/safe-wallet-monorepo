import { useCallback } from 'react'
import useChainId from '@/hooks/useChainId'
import { useCurrentChain } from '@/hooks/useChains'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import useSafeInfo from '@/hooks/useSafeInfo'
import { getLegacyChainName } from '../utils'
import { useNestedSafeOwners } from '@/hooks/useNestedSafeOwners'

const useGetSafeInfo = () => {
  const { safe, safeAddress } = useSafeInfo()
  const isOwner = useIsSafeOwner()
  const nestedSafeOwners = useNestedSafeOwners()
  const chainId = useChainId()
  const chain = useCurrentChain()
  const chainName = chain?.chainName || ''

  return useCallback(() => {
    return {
      safeAddress,
      chainId: parseInt(chainId, 10),
      owners: safe.owners.map((owner) => owner.value),
      threshold: safe.threshold,
      isReadOnly: !isOwner && (nestedSafeOwners == null || nestedSafeOwners.length === 0),
      nonce: safe.nonce,
      implementation: safe.implementation.value,
      modules: safe.modules ? safe.modules.map((module) => module.value) : null,
      fallbackHandler: safe.fallbackHandler ? safe.fallbackHandler?.value : null,
      guard: safe.guard?.value || null,
      version: safe.version || null,
      network: getLegacyChainName(chainName || '', chainId).toUpperCase(),
    }
  }, [
    safeAddress,
    chainId,
    safe.owners,
    safe.threshold,
    safe.nonce,
    safe.implementation.value,
    safe.modules,
    safe.fallbackHandler,
    safe.guard?.value,
    safe.version,
    isOwner,
    nestedSafeOwners,
    chainName,
  ])
}

export default useGetSafeInfo
