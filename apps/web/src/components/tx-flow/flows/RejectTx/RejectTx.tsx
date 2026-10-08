import type { ReactElement } from 'react'
import { createRejectTx } from '@/services/tx/tx-sender'
import { useContext, useEffect } from 'react'
import { SafeTxContext } from '../../SafeTxProvider'
import ReviewTransaction from '@/components/tx/ReviewTransactionV2'
import type { ReviewTransactionProps } from '@/components/tx/ReviewTransactionV2'
import { TxFlowContext } from '../../TxFlowProvider'
import { RejectTxView } from '@views/components/tx-flow/flows/RejectTx/RejectTxView'

const RejectTx = ({ onSubmit, children }: ReviewTransactionProps): ReactElement => {
  const { txNonce } = useContext(TxFlowContext)
  const { setSafeTx, setSafeTxError, setNonce } = useContext(SafeTxContext)

  useEffect(() => {
    if (txNonce == undefined) return

    setNonce(txNonce)

    createRejectTx(txNonce).then(setSafeTx).catch(setSafeTxError)
  }, [txNonce, setNonce, setSafeTx, setSafeTxError])

  return (
    <ReviewTransaction onSubmit={onSubmit}>
      <RejectTxView txNonce={txNonce} />

      {children}
    </ReviewTransaction>
  )
}

export default RejectTx
