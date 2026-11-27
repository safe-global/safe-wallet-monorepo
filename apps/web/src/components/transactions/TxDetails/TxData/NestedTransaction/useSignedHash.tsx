import type { TransactionData } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Safe__factory } from '@safe-global/utils/types/contracts'
import { useMemo } from 'react'
import { isOnChainConfirmationTxData } from '@/utils/transaction-guards'

const safeInterface = Safe__factory.createInterface()

const decodeApprovedHash = (hexData: string): string | undefined => {
  try {
    const [hash] = safeInterface.decodeFunctionData('approveHash', hexData)
    return typeof hash === 'string' ? hash : undefined
  } catch {
    // Anyone can queue calldata with the approveHash selector and a malformed argument
    return undefined
  }
}

export const useSignedHash = (txData?: TransactionData | null): string | undefined =>
  useMemo(() => {
    if (!txData?.hexData || !isOnChainConfirmationTxData(txData)) return undefined
    return decodeApprovedHash(txData.hexData)
  }, [txData])
