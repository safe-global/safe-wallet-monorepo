import { type ReactElement, useContext, useEffect } from 'react'
import { Typography } from '@mui/material'
import type { TransactionSummary } from '@safe-global/safe-gateway-typescript-sdk'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useChainId } from '@/hooks/useChainId'
import { useSigner } from '@/hooks/wallets/useWallet'
import { isExecutable, isMultisigExecutionInfo, isSignableBy } from '@/utils/transaction-guards'
import { createExistingTx } from '@/services/tx/tx-sender'
import { SafeTxContext } from '../../SafeTxProvider'
import SignOrExecuteForm from '@/components/tx/SignOrExecuteForm'

type ConfirmProposedTxProps = {
  txSummary: TransactionSummary
}

const SIGN_TEXT = 'Sign this transaction.'
const EXECUTE_TEXT = 'Submit the form to execute this transaction.'
const SIGN_EXECUTE_TEXT = 'Sign or immediately execute this transaction.'

const ConfirmProposedTx = ({ txSummary }: ConfirmProposedTxProps): ReactElement => {
  const signer = useSigner()
  const { safe } = useSafeInfo()
  const chainId = useChainId()
  const { setSafeTx, setSafeTxError, setNonce } = useContext(SafeTxContext)

  const txId = txSummary.id
  const txNonce = isMultisigExecutionInfo(txSummary.executionInfo) ? txSummary.executionInfo.nonce : undefined
  const canExecute = isExecutable(txSummary, signer?.address || '', safe)
  const canSign = isSignableBy(txSummary, signer?.address || '')

  useEffect(() => {
    txNonce !== undefined && setNonce(txNonce)
  }, [setNonce, txNonce])

  useEffect(() => {
    createExistingTx(chainId, txId).then(setSafeTx).catch(setSafeTxError)
  }, [txId, chainId, setSafeTx, setSafeTxError])

  const text = canSign ? (canExecute ? SIGN_EXECUTE_TEXT : SIGN_TEXT) : EXECUTE_TEXT

  return (
    <SignOrExecuteForm txId={txId} isExecutable={canExecute} onlyExecute={!canSign} showMethodCall>
      <Typography mb={1}>{text}</Typography>
    </SignOrExecuteForm>
  )
}

export default ConfirmProposedTx
