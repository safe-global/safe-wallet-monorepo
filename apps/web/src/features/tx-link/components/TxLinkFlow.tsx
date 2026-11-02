import { useCallback, useContext, useEffect, type ReactElement } from 'react'
import type { BaseTransaction } from '@safe-global/safe-apps-sdk'
import { TxFlow } from '@/components/tx-flow/TxFlow'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import ReviewTransaction from '@/components/tx/ReviewTransactionV2'
import { type ReviewTransactionContentProps } from '@/components/tx/ReviewTransactionV2/ReviewTransactionContent'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { createMultiSendCallOnlyTx, createTx } from '@/services/tx/tx-sender'
import { useSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'

export type TxLinkFlowProps = {
  txs: BaseTransaction[]
  nonce?: number
}

const ReviewTxLink = ({
  txs,
  nonce,
  children,
  ...props
}: TxLinkFlowProps & ReviewTransactionContentProps): ReactElement => {
  const { setSafeTx, setSafeTxError, setNonce } = useContext(SafeTxContext)
  const safeSDK = useSafeSDK()

  useEffect(() => {
    if (!safeSDK) return

    const createSafeTx = txs.length > 1 ? createMultiSendCallOnlyTx(txs) : createTx(txs[0])
    createSafeTx.then(setSafeTx).catch(setSafeTxError)
  }, [safeSDK, txs, setSafeTx, setSafeTxError])

  useEffect(() => {
    if (nonce !== undefined) setNonce(nonce)
  }, [nonce, setNonce])

  return (
    <ReviewTransaction {...props}>
      <ErrorMessage level="warning" title="Transaction from a link">
        Every detail of this transaction was filled in by the link you opened. Check each call before you sign.
      </ErrorMessage>
      {children}
    </ReviewTransaction>
  )
}

const TxLinkFlow = ({ txs, nonce }: TxLinkFlowProps): ReactElement => {
  const ReviewTransactionComponent = useCallback(
    (props: ReviewTransactionContentProps) => <ReviewTxLink txs={txs} nonce={nonce} {...props} />,
    [txs, nonce],
  )

  return <TxFlow initialData={txs} title="Review transaction" ReviewTransactionComponent={ReviewTransactionComponent} />
}

export default TxLinkFlow
