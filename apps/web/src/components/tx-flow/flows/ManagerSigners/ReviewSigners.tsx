import { useContext, useEffect } from 'react'
import type { SafeTransaction } from '@safe-global/safe-core-sdk-types'
import type { ReactElement } from 'react'

import useSafeInfo from '@/hooks/useSafeInfo'
import { createMultiSendCallOnlyTx, createTx } from '@/services/tx/tx-sender'
import { SafeTxContext } from '../../SafeTxProvider'
import { getRecoveryProposalTransactions } from '@/features/recovery/services/transaction'
import ReviewTransaction from '@/components/tx/ReviewTransactionV2'
import { TxFlowContext } from '../../TxFlowProvider'
import type { ManageSignersForm } from '.'
import type { TxFlowContextType } from '../../TxFlowProvider'
import type { ReviewTransactionContentProps } from '@/components/tx/ReviewTransactionV2/ReviewTransactionContent'

export function ReviewSigners(props: ReviewTransactionContentProps): ReactElement {
  const { data } = useContext<TxFlowContextType<ManageSignersForm>>(TxFlowContext)
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)
  const { safe } = useSafeInfo()

  useEffect(() => {
    if (!data) {
      return
    }

    const transactions = getRecoveryProposalTransactions({
      safe,
      newThreshold: data.threshold,
      newOwners: data.owners.map((owner) => ({
        value: owner.address,
      })),
    })

    const createSafeTx = async (): Promise<SafeTransaction> => {
      const isMultiSend = transactions.length > 1
      return isMultiSend ? createMultiSendCallOnlyTx(transactions) : createTx(transactions[0])
    }

    createSafeTx().then(setSafeTx).catch(setSafeTxError)
  }, [data, safe, setSafeTx, setSafeTxError])

  return <ReviewTransaction {...props} />
}
