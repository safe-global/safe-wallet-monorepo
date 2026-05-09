import { useEffect, useState } from 'react'
import { SafeTransaction } from '@safe-global/types-kit'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import extractTxInfo from '@/src/services/tx/extractTx'
import { createExistingTx } from '@/src/services/tx/tx-sender'
import { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useSafeSDK } from '@/src/hooks/coreSDK/safeCoreSDK'

/**
 * Hook to create a SafeTransaction from transaction details.
 *
 * Since the first state of txDetails can be undefined, we need to handle it gracefully.
 * Also waits for the Safe SDK to be initialized before attempting to create the transaction.
 */
const useSafeTx = (txDetails: TransactionDetails | undefined) => {
  const [safeTx, setSafeTx] = useState<SafeTransaction>()
  const activeSafe = useDefinedActiveSafe()
  const safeSDK = useSafeSDK()

  useEffect(() => {
    if (!txDetails || !safeSDK) {
      setSafeTx(undefined)
      return
    }

    const getSafeTxData = async () => {
      try {
        const { txParams, signatures } = extractTxInfo(txDetails, activeSafe.address)
        const safeTx = await createExistingTx(txParams, signatures)
        setSafeTx(safeTx)
      } catch (e) {
        console.error('Failed to create safe tx', e)
        setSafeTx(undefined)
      }
    }

    getSafeTxData()
  }, [txDetails, activeSafe.address, safeSDK])

  return safeTx
}

export default useSafeTx
