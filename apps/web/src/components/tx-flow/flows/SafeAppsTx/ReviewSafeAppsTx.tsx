import { useContext, useEffect, useMemo } from 'react'
import type { ReactElement } from 'react'
import type { SafeTransaction } from '@safe-global/safe-core-sdk-types'
import type { SafeAppsTxParams } from '.'
import { getTxOrigin } from '@/utils/transactions'
import { createMultiSendCallOnlyTx, createTx } from '@/services/tx/tx-sender'
import useHighlightHiddenTab from '@/hooks/useHighlightHiddenTab'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { isTxValid } from '@/components/safe-apps/utils'
import ErrorMessage from '@/components/tx/ErrorMessage'
import ReviewTransaction from '@/components/tx/ReviewTransaction'

type ReviewSafeAppsTxProps = {
  safeAppsTx: SafeAppsTxParams
  onSubmit: () => void
}

const ReviewSafeAppsTx = ({ safeAppsTx: { txs, params, app }, onSubmit }: ReviewSafeAppsTxProps): ReactElement => {
  const { setSafeTx, safeTxError, setSafeTxError, setTxOrigin } = useContext(SafeTxContext)

  useHighlightHiddenTab()

  useEffect(() => {
    setTxOrigin(app?.url)
    return () => setTxOrigin(undefined)
  }, [setTxOrigin, app?.url])

  useEffect(() => {
    const createSafeTx = async (): Promise<SafeTransaction> => {
      const isMultiSend = txs.length > 1
      const tx = isMultiSend ? await createMultiSendCallOnlyTx(txs) : await createTx(txs[0])

      if (params?.safeTxGas !== undefined) {
        // FIXME: do it properly via the Core SDK
        // @ts-expect-error safeTxGas readonly
        tx.data.safeTxGas = params.safeTxGas
      }

      return tx
    }

    createSafeTx().then(setSafeTx).catch(setSafeTxError)
  }, [txs, setSafeTx, setSafeTxError, params])

  const origin = useMemo(() => getTxOrigin(app), [app])
  const error = !isTxValid(txs)

  return (
    <ReviewTransaction onSubmit={onSubmit} origin={origin} showMethodCall>
      {error ? (
        <ErrorMessage error={safeTxError}>
          This Safe App initiated a transaction which cannot be processed. Please get in touch with the developer of
          this Safe App for more information.
        </ErrorMessage>
      ) : null}
    </ReviewTransaction>
  )
}

export default ReviewSafeAppsTx
