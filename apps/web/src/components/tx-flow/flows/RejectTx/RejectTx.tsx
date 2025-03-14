import type { ReactElement } from 'react'
import { Typography } from '@mui/material'
import { createRejectTx } from '@/services/tx/tx-sender'
import { useContext, useEffect } from 'react'
import { SafeTxContext } from '../../SafeTxProvider'
import ReviewTransaction from '@/components/tx/ReviewTransaction'

type RejectTxProps = {
  txNonce: number
  onSubmit: () => void
}

const RejectTx = ({ txNonce, onSubmit }: RejectTxProps): ReactElement => {
  const { setSafeTx, setSafeTxError, setNonce } = useContext(SafeTxContext)

  useEffect(() => {
    setNonce(txNonce)

    createRejectTx(txNonce).then(setSafeTx).catch(setSafeTxError)
  }, [txNonce, setNonce, setSafeTx, setSafeTxError])

  return (
    <ReviewTransaction isBatchable={false} onSubmit={onSubmit} isRejection>
      <Typography mb={2}>
        To reject the transaction, a separate rejection transaction will be created to replace the original one.
      </Typography>

      <Typography mb={2}>
        Transaction nonce: <b>{txNonce}</b>
      </Typography>

      <Typography mb={2}>
        You will need to confirm the rejection transaction with your currently connected wallet.
      </Typography>
    </ReviewTransaction>
  )
}

export default RejectTx
