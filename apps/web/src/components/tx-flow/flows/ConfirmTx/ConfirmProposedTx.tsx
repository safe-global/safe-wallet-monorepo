import { type ReactElement, useContext, useEffect } from 'react'
import { Typography } from '@mui/material'
import { useChainId } from '@/hooks/useChainId'
import { createExistingTx } from '@/services/tx/tx-sender'
import { SafeTxContext } from '../../SafeTxProvider'
import ReviewTransaction from '@/components/tx/ReviewTransaction'

type ConfirmProposedTxProps = {
  txNonce: number | undefined
  txId: string
  onSubmit: () => void
  isExecutable: boolean
  onlyExecute: boolean
}

const SIGN_TEXT = 'Sign this transaction.'
const EXECUTE_TEXT = 'Submit the form to execute this transaction.'
const SIGN_EXECUTE_TEXT = 'Sign or immediately execute this transaction.'

const ConfirmProposedTx = ({ txNonce, ...props }: ConfirmProposedTxProps): ReactElement => {
  const chainId = useChainId()
  const { setSafeTx, setSafeTxError, setNonce } = useContext(SafeTxContext)

  useEffect(() => {
    txNonce !== undefined && setNonce(txNonce)
  }, [setNonce, txNonce])

  useEffect(() => {
    createExistingTx(chainId, props.txId).then(setSafeTx).catch(setSafeTxError)
  }, [props.txId, chainId, setSafeTx, setSafeTxError])

  const text = !props.onlyExecute ? (props.isExecutable ? SIGN_EXECUTE_TEXT : SIGN_TEXT) : EXECUTE_TEXT

  return (
    <ReviewTransaction {...props}>
      <Typography mb={1}>{text}</Typography>
    </ReviewTransaction>
  )
}

export default ConfirmProposedTx
