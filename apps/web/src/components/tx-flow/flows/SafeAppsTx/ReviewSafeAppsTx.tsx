import { useContext, useEffect } from 'react'
import type { ReactElement } from 'react'
import type { SafeTransaction } from '@safe-global/types-kit'
import type { SafeAppsTxParams } from '.'
import { createMultiSendCallOnlyTx, createTx } from '@/services/tx/tx-sender'
import useHighlightHiddenTab from '@/hooks/useHighlightHiddenTab'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { isTxValid } from '@/components/safe-apps/utils'
import ErrorMessage from '@/components/tx/ErrorMessage'
import ReviewTransaction from '@/components/tx/ReviewTransactionV2'
import { type ReviewTransactionContentProps } from '@/components/tx/ReviewTransactionV2/ReviewTransactionContent'
import { getTxOrigin } from '@/utils/transactions'
import { useSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import useSafeInfo from '@/hooks/useSafeInfo'
import { isKnownPolicyGuard } from '@safe-global/utils/features/policy-guard/constants'

type ReviewSafeAppsTxProps = {
  safeAppsTx: SafeAppsTxParams
  onSubmit: () => void
} & ReviewTransactionContentProps

const ReviewSafeAppsTx = ({
  safeAppsTx: { txs, params, app },
  onSubmit,
  children,
  ...props
}: ReviewSafeAppsTxProps): ReactElement => {
  const { setSafeTx, safeTxError, setSafeTxError, setTxOrigin } = useContext(SafeTxContext)
  const safeSDK = useSafeSDK()
  const { safe } = useSafeInfo()
  const isPolicyGuarded = isKnownPolicyGuard(safe.guard?.value)

  useHighlightHiddenTab()

  useEffect(() => {
    // An app can request a transaction right after the page loads, before the Safe SDK is ready
    if (!safeSDK) return

    const createSafeTx = async (): Promise<SafeTransaction> => {
      const isMultiSend = txs.length > 1
      const tx = isMultiSend ? await createMultiSendCallOnlyTx(txs) : await createTx(txs[0])

      // A policy guard rejects a non-zero safeTxGas
      if (params?.safeTxGas !== undefined && !Number.isNaN(params.safeTxGas) && !isPolicyGuarded) {
        tx.data.safeTxGas = String(params.safeTxGas)
      }

      return tx
    }

    createSafeTx()
      .then((tx) => {
        setSafeTx(tx)
        setTxOrigin(getTxOrigin(app))
      })
      .catch(setSafeTxError)
  }, [safeSDK, txs, setSafeTx, setSafeTxError, setTxOrigin, app, params?.safeTxGas, isPolicyGuarded])

  const error = !isTxValid(txs)

  return (
    <ReviewTransaction onSubmit={onSubmit} {...props}>
      {error ? (
        <ErrorMessage error={safeTxError}>
          This Safe App initiated a transaction which cannot be processed. Please get in touch with the developer of
          this Safe App for more information.
        </ErrorMessage>
      ) : null}
      {children}
    </ReviewTransaction>
  )
}

export default ReviewSafeAppsTx
