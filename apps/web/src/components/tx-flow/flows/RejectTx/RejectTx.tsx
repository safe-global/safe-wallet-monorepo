import type { ReactElement } from 'react'
import { Typography } from '@safe-global/views/components/ui/typography'
import { createRejectTx } from '@/services/tx/tx-sender'
import { useContext, useEffect } from 'react'
import { SafeTxContext } from '../../SafeTxProvider'
import ReviewTransaction from '@/components/tx/ReviewTransactionV2'
import type { ReviewTransactionProps } from '@/components/tx/ReviewTransactionV2'
import { TxFlowContext } from '../../TxFlowProvider'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope/context'

const RejectTx = ({ onSubmit, children }: ReviewTransactionProps): ReactElement => {
  const { txNonce } = useContext(TxFlowContext)
  const scope = useSafeScope()
  const { setSafeTx, setSafeTxError, setNonce } = useContext(SafeTxContext)

  useEffect(() => {
    if (txNonce == undefined) return

    setNonce(txNonce)

    // A Space-level scope has no SDK until it is initialised; building without it fails.
    if (scope && !scope.sdk) return
    createRejectTx(txNonce, scope).then(setSafeTx).catch(setSafeTxError)
  }, [txNonce, scope, setNonce, setSafeTx, setSafeTxError])

  return (
    <ReviewTransaction onSubmit={onSubmit}>
      <Typography className="mb-4">
        To reject the transaction, a separate rejection transaction will be created to replace the original one.
      </Typography>

      <Typography className="mb-4">
        Transaction nonce: <b>{txNonce}</b>
      </Typography>

      <Typography className="mb-4">
        You will need to confirm the rejection transaction with your currently connected wallet.
      </Typography>

      {children}
    </ReviewTransaction>
  )
}

export default RejectTx
