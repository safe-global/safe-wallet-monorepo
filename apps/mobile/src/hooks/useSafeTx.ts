import { useEffect, useState } from 'react'
import { SafeTransaction } from '@safe-global/types-kit'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import extractTxInfo from '@/src/services/tx/extractTx'
import { createExistingTx } from '@/src/services/tx/tx-sender'
import { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

/**
 * Hook to create a SafeTransaction from transaction details.
 *
 * Since the first state of txDetails can be undefined, we need to handle it gracefully.
 */
const useSafeTx = (txDetails: TransactionDetails | undefined) => {
  const [safeTx, setSafeTx] = useState<SafeTransaction>()
  const activeSafe = useDefinedActiveSafe()

  useEffect(() => {
    if (!txDetails) {
      setSafeTx(undefined)
      return
    }

    const getSafeTxData = async () => {
      try {
        const { txParams, signatures } = extractTxInfo(txDetails, activeSafe.address)
        const safeTx = await createExistingTx(txParams, signatures)
        setSafeTx(safeTx)
      } catch (e) {
        console.error(e)
      }
    }

    getSafeTxData()
  }, [txDetails, activeSafe.address])

  return safeTx
}

export default useSafeTx
