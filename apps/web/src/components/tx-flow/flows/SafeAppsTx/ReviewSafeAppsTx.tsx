import useWallet from '@/hooks/wallets/useWallet'
import { useContext, useEffect, useMemo } from 'react'
import type { ReactElement } from 'react'
import type { SafeTransaction } from '@safe-global/safe-core-sdk-types'
import SignOrExecuteForm from '@/components/tx/SignOrExecuteForm'
import type { SafeAppsTxParams } from '.'
import { trackSafeAppTxCount } from '@/services/safe-apps/track-app-usage-count'
import { getTxOrigin } from '@/utils/transactions'
import { createMultiSendCallOnlyTx, createTx, dispatchSafeAppsTx } from '@/services/tx/tx-sender'
import useOnboard from '@/hooks/wallets/useOnboard'
import useHighlightHiddenTab from '@/hooks/useHighlightHiddenTab'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { isTxValid } from '@/components/safe-apps/utils'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { asError } from '@/services/exceptions/utils'

type ReviewSafeAppsTxProps = {
  safeAppsTx: SafeAppsTxParams
  onSubmit?: (txId: string, safeTxHash: string) => void
}

const ReviewSafeAppsTx = ({
  safeAppsTx: { txs, requestId, params, appId, app },
  onSubmit,
}: ReviewSafeAppsTxProps): ReactElement => {
  const onboard = useOnboard()
  const wallet = useWallet()
  const { safeTx, setSafeTx, safeTxError, setSafeTxError, setTxOrigin } = useContext(SafeTxContext)

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

  const handleSubmit = async (txId: string) => {
    if (!safeTx || !onboard || !wallet?.provider) return
    trackSafeAppTxCount(Number(appId))

    let safeTxHash = ''
    try {
      safeTxHash = await dispatchSafeAppsTx(safeTx, requestId, wallet.provider, txId)
    } catch (error) {
      setSafeTxError(asError(error))
    }

    onSubmit?.(txId, safeTxHash)
  }

  const origin = useMemo(() => getTxOrigin(app), [app])
  const error = !isTxValid(txs)

  return (
    <SignOrExecuteForm onSubmit={handleSubmit} origin={origin} showMethodCall>
      {error ? (
        <ErrorMessage error={safeTxError}>
          This Safe App initiated a transaction which cannot be processed. Please get in touch with the developer of
          this Safe App for more information.
        </ErrorMessage>
      ) : null}
    </SignOrExecuteForm>
  )
}

export default ReviewSafeAppsTx
