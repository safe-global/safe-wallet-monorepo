import type { BaseTransaction, RequestId, SendTransactionRequestParams } from '@safe-global/safe-apps-sdk'
import TxLayout from '@/components/tx-flow/common/TxLayout'
import type { TxStep } from '../../common/TxLayout'
import type { SafeAppData } from '@safe-global/safe-gateway-typescript-sdk'
import ReviewSafeAppsTx from './ReviewSafeAppsTx'
import { AppTitle } from '@/components/tx-flow/flows/SignMessage'
import useTxStepper from '../../useTxStepper'
import { useCallback, useContext, useMemo } from 'react'
import { ConfirmTxDetails } from '@/components/tx/ConfirmTxDetails'
import { asError } from '@/services/exceptions/utils'
import { SafeTxContext } from '../../SafeTxProvider'
import useWallet from '@/hooks/wallets/useWallet'
import useOnboard from '@/hooks/wallets/useOnboard'
import { dispatchSafeAppsTx } from '@/services/tx/tx-sender'
import { trackSafeAppTxCount } from '@/services/safe-apps/track-app-usage-count'

export type SafeAppsTxParams = {
  appId?: string
  app?: Partial<SafeAppData>
  requestId: RequestId
  txs: BaseTransaction[]
  params?: SendTransactionRequestParams
}

const SafeAppsTxFlow = ({
  data,
  onSubmit,
}: {
  data: SafeAppsTxParams
  onSubmit?: (txId: string, safeTxHash: string) => void
}) => {
  const { safeTx, setSafeTxError } = useContext(SafeTxContext)
  const onboard = useOnboard()
  const wallet = useWallet()
  const { step, nextStep, prevStep } = useTxStepper(null)

  const handleSubmit = useCallback(
    async (txId: string) => {
      if (!safeTx || !onboard || !wallet?.provider) return
      trackSafeAppTxCount(Number(data.appId))

      let safeTxHash = ''
      try {
        safeTxHash = await dispatchSafeAppsTx(safeTx, data.requestId, wallet.provider, txId)
      } catch (error) {
        setSafeTxError(asError(error))
      }

      onSubmit?.(txId, safeTxHash)
    },
    [safeTx, data, onboard, wallet, setSafeTxError, onSubmit],
  )

  const steps = useMemo<TxStep[]>(
    () => [
      {
        txLayoutProps: { title: 'Confirm transaction' },
        content: <ReviewSafeAppsTx key={0} safeAppsTx={data} onSubmit={() => nextStep(null)} />,
      },
      {
        txLayoutProps: { title: 'Confirm transaction details', fixedNonce: true },
        content: <ConfirmTxDetails key={1} onSubmit={handleSubmit} />,
      },
    ],
    [nextStep, data, handleSubmit],
  )
  return (
    <TxLayout
      subtitle={<AppTitle name={data.app?.name} logoUri={data.app?.iconUrl} txs={data.txs} />}
      step={step}
      onBack={prevStep}
      {...(steps?.[step]?.txLayoutProps || {})}
    >
      {steps.map(({ content }) => content)}
    </TxLayout>
  )
}

export default SafeAppsTxFlow
