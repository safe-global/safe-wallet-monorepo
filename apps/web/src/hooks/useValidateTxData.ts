import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { useSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { validateTxSignatures } from '@/services/tx/executionPreChecks'
import { useContext } from 'react'

export const useValidateTxData = (txId?: string) => {
  const { safeTx } = useContext(SafeTxContext)

  const sdk = useSafeSDK()

  return useAsync(async () => {
    if (!sdk || !safeTx) {
      return
    }
    // Validate hash
    const computedSafeTxHash = await sdk.getTransactionHash(safeTx)

    if (txId && txId.slice(-66) !== computedSafeTxHash) {
      return 'The transaction data does not match its safeTxHash'
    }

    // Validate non-1271 signatures locally (shared with the GS026 pre-checks)
    return validateTxSignatures(safeTx, computedSafeTxHash)
  }, [sdk, safeTx, txId])
}
