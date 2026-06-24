import { type PropsWithChildren, type ReactElement, useContext, useEffect } from 'react'
import useChainId from '@/hooks/useChainId'
import { createExistingTx } from '@/services/tx/tx-sender'
import ReviewTransaction from '@/components/tx/ReviewTransactionV2'
import type { ReviewTransactionContentProps } from '@/components/tx/ReviewTransactionV2/ReviewTransactionContent'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'

type ConfirmProposedTxProps = PropsWithChildren<
  {
    txNonce: number | undefined
  } & ReviewTransactionContentProps
>

const ConfirmProposedTx = ({ txNonce, children, ...props }: ConfirmProposedTxProps): ReactElement => {
  const chainId = useChainId()
  const { setSafeTx, setSafeTxError, setNonce } = useContext(SafeTxContext)
  const { txId } = useContext(TxFlowContext)

  useEffect(() => {
    if (txNonce !== undefined) {
      setNonce(txNonce)
    }
  }, [setNonce, txNonce])

  useEffect(() => {
    if (txId) {
      createExistingTx(chainId, txId).then(setSafeTx).catch(setSafeTxError)
    }
  }, [txId, chainId, setSafeTx, setSafeTxError])

  return <ReviewTransaction {...props}>{children}</ReviewTransaction>
}

export default ConfirmProposedTx
