import { useContext, useEffect } from 'react'
import type { ReactElement } from 'react'

import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import useSafeInfo from '@/hooks/useSafeInfo'
import { getRecoveryUpsertTransactions } from '@/features/recovery/services'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3ReadOnly'
import { createMultiSendCallOnlyTx, createTx } from '@/services/tx/tx-sender'
import type { UpsertRecoveryFlowProps } from '.'
import { TxFlowContext, type TxFlowContextType } from '../../TxFlowProvider'
import ReviewTransaction, { type ReviewTransactionProps } from '@/components/tx/ReviewTransactionV2'
import {
  UpsertRecoveryFlowReviewNoDataView,
  UpsertRecoveryFlowReviewView,
} from '@views/components/tx-flow/flows/UpsertRecovery/UpsertRecoveryFlowReviewView'

export function UpsertRecoveryFlowReview({ children, ...props }: ReviewTransactionProps): ReactElement {
  const web3ReadOnly = useWeb3ReadOnly()
  const { safe, safeAddress } = useSafeInfo()
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)

  const { data } = useContext<TxFlowContextType<UpsertRecoveryFlowProps>>(TxFlowContext)

  useEffect(() => {
    if (!web3ReadOnly || !data) {
      return
    }

    getRecoveryUpsertTransactions({
      ...data,
      provider: web3ReadOnly,
      chainId: safe.chainId,
      safeAddress,
    })
      .then((transactions) => {
        return transactions.length > 1 ? createMultiSendCallOnlyTx(transactions) : createTx(transactions[0])
      })
      .then(setSafeTx)
      .catch(setSafeTxError)
  }, [data, safe.chainId, safeAddress, setSafeTx, setSafeTxError, web3ReadOnly])

  const isEdit = !!data?.moduleAddress

  if (!data) {
    return <UpsertRecoveryFlowReviewNoDataView />
  }

  const { recoverer, delay, expiry } = data
  const expirySeconds = Number(expiry)

  return (
    <ReviewTransaction {...props}>
      <UpsertRecoveryFlowReviewView
        isEdit={isEdit}
        recoverer={recoverer}
        delaySeconds={Number(delay)}
        expirySeconds={expirySeconds}
      >
        {children}
      </UpsertRecoveryFlowReviewView>
    </ReviewTransaction>
  )
}
