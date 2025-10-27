import type { OwnedSafes } from '@safe-global/store/gateway/types'
import { useMemo } from 'react'

import useWallet from '@/hooks/wallets/useWallet'
import useChainId from './useChainId'
import { useOwnersGetAllSafesByOwnerV2Query } from '@safe-global/store/gateway/AUTO_GENERATED/owners'

type OwnedSafesCache = {
  [walletAddress: string]: {
    [chainId: string]: OwnedSafes['safes']
  }
}

const useOwnedSafes = (customChainId?: string): OwnedSafesCache['walletAddress'] => {
  const currentChainId = useChainId()
  const chainId = customChainId ?? currentChainId
  const { address: walletAddress } = useWallet() || {}

  const { currentData: ownedSafes } = useOwnersGetAllSafesByOwnerV2Query(
    { ownerAddress: walletAddress || '' },
    { skip: !walletAddress },
  )

  const result = useMemo(() => ({ [chainId]: ownedSafes?.[chainId] ?? [] }), [chainId, ownedSafes])

  return result ?? {}
}

export default useOwnedSafes
