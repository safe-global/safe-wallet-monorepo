import { type ReactElement, useContext, useEffect, useMemo } from 'react'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope/context'
import type { TxSenderScope } from '@safe-global/views/components/tx-flow/safe-scope/types'
import { Typography } from '@safe-global/views/components/ui/typography'
import useChainId from '@/hooks/useChainId'
import { createExistingTx } from '@/services/tx/tx-sender'
import ReviewTransaction from '@/components/tx/ReviewTransactionV2'
import type { ReviewTransactionProps } from '@/components/tx/ReviewTransactionV2'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'

const SIGN_TEXT = 'Sign this transaction.'
const EXECUTE_TEXT = 'Submit the form to execute this transaction.'
const SIGN_EXECUTE_TEXT = 'Sign or immediately execute this transaction.'

const ConfirmProposedTx = ({ children, ...props }: ReviewTransactionProps): ReactElement => {
  const chainId = useChainId()
  const scope = useSafeScope()
  const { setSafeTx, setSafeTxError, setNonce } = useContext(SafeTxContext)
  const { txId, txNonce, onlyExecute, isExecutable } = useContext(TxFlowContext)

  useEffect(() => {
    if (txNonce !== undefined) {
      setNonce(txNonce)
    }
  }, [setNonce, txNonce])

  const scopeSafeAddress = scope?.safeAddress
  const scopeSdk = scope?.sdk
  const txSenderScope = useMemo<TxSenderScope | undefined>(
    () => (scopeSafeAddress ? { chainId, safeAddress: scopeSafeAddress, sdk: scopeSdk } : undefined),
    [chainId, scopeSafeAddress, scopeSdk],
  )

  useEffect(() => {
    if (!txId || (txSenderScope && !txSenderScope.sdk)) return
    createExistingTx(chainId, txId, undefined, txSenderScope).then(setSafeTx).catch(setSafeTxError)
  }, [txId, chainId, txSenderScope, setSafeTx, setSafeTxError])

  const text = !onlyExecute ? (isExecutable ? SIGN_EXECUTE_TEXT : SIGN_TEXT) : EXECUTE_TEXT

  return (
    <ReviewTransaction {...props}>
      <Typography className="mb-2">{text}</Typography>
      {children}
    </ReviewTransaction>
  )
}

export default ConfirmProposedTx
