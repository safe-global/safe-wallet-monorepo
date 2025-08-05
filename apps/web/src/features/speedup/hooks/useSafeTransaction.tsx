import { useSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import useChainId from '@/hooks/useChainId'
import { useEffect, useState } from 'react'
import type { SafeTransaction } from '@safe-global/types-kit'
import { createExistingTx } from '@/services/tx/tx-sender'

export const useSafeTransaction = (txId: string) => {
  const safeSdk = useSafeSDK()
  const chainId = useChainId()
  const [safeTx, setSafeTx] = useState<SafeTransaction>()

  useEffect(() => {
    if (!safeSdk) {
      return
    }
    createExistingTx(chainId, txId).then(setSafeTx)
  }, [chainId, txId, safeSdk])

  return safeTx
}
