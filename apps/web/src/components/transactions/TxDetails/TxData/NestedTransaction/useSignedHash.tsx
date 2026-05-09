import type { TransactionData } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Safe__factory } from '@safe-global/utils/types/contracts'
import { useMemo } from 'react'
import { isOnChainConfirmationTxData } from '@/utils/transaction-guards'

const safeInterface = Safe__factory.createInterface()

export const useSignedHash = (txData?: TransactionData | null) => {
  const signedHash = useMemo(() => {
    if (!isOnChainConfirmationTxData(txData)) {
      return
    }

    const params = txData?.hexData ? safeInterface.decodeFunctionData('approveHash', txData?.hexData) : undefined
    if (!params || params.length !== 1 || typeof params[0] !== 'string') {
      return
    }

    return params[0]
  }, [txData])

  return signedHash
}
