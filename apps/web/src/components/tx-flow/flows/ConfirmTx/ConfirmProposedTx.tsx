import { type PropsWithChildren, type ReactElement, useContext, useEffect } from 'react'
import { Typography } from '@mui/material'
import { useChainId } from '@/hooks/useChainId'
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

const SIGN_TEXT = 'Sign this transaction.'
const EXECUTE_TEXT = 'Submit the form to execute this transaction.'
const SIGN_EXECUTE_TEXT = 'Sign or immediately execute this transaction.'

const ConfirmProposedTx = ({ txNonce, children, ...props }: ConfirmProposedTxProps): ReactElement => {
  const chainId = useChainId()
  const { setSafeTx, setSafeTxError, setNonce } = useContext(SafeTxContext)
  const { txId, onlyExecute, isExecutable } = useContext(TxFlowContext)

  useEffect(() => {
    txNonce !== undefined && setNonce(txNonce)
  }, [setNonce, txNonce])

  useEffect(() => {
    if (txId) {
      createExistingTx(chainId, txId).then(setSafeTx).catch(setSafeTxError)
    }
  }, [txId, chainId, setSafeTx, setSafeTxError])

  const text = !onlyExecute ? (isExecutable ? SIGN_EXECUTE_TEXT : SIGN_TEXT) : EXECUTE_TEXT

  return (
    <ReviewTransaction {...props}>
      <Typography mb={1}>{text}</Typography>
      {children}
    </ReviewTransaction>
  )
}

export default ConfirmProposedTx
