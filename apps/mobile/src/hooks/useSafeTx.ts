import { useEffect, useState } from 'react'
import { SafeTransaction } from '@safe-global/types-kit'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import extractTxInfo from '@/src/services/tx/extractTx'
import { createExistingTx } from '@/src/services/tx/tx-sender'
import { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

const useSafeTx = (txDetails: TransactionDetails) => {
  const [safeTx, setSafeTx] = useState<SafeTransaction>()
  const activeSafe = useDefinedActiveSafe()

  useEffect(() => {
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
