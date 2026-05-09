import type { ReactElement } from 'react'
import { Typography } from '@mui/material'
import { createRejectTx } from '@/services/tx/tx-sender'
import { useContext, useEffect } from 'react'
import { SafeTxContext } from '../../SafeTxProvider'
import ReviewTransaction from '@/components/tx/ReviewTransactionV2'
import type { ReviewTransactionProps } from '@/components/tx/ReviewTransactionV2'
import { TxFlowContext } from '../../TxFlowProvider'

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
      <Typography mb={2}>
        To reject the transaction, a separate rejection transaction will be created to replace the original one.
      </Typography>

      <Typography mb={2}>
        Transaction nonce: <b>{txNonce}</b>
      </Typography>

      <Typography mb={2}>
        You will need to confirm the rejection transaction with your currently connected wallet.
      </Typography>

      {children}
    </ReviewTransaction>
  )
}

export default RejectTx
