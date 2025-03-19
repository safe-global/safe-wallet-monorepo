import type { BaseTransaction, RequestId, SendTransactionRequestParams } from '@safe-global/safe-apps-sdk'
import TxLayout from '@/components/tx-flow/common/TxLayout'
import type { TxStep } from '../../common/TxLayout'
import type { SafeAppData } from '@safe-global/safe-gateway-typescript-sdk'
import ReviewSafeAppsTx from './ReviewSafeAppsTx'
import { AppTitle } from '@/components/tx-flow/flows/SignMessage'
import useTxStepper from '../../useTxStepper'
import { useMemo } from 'react'
import { getTxOrigin } from '@/utils/transactions'
import { ConfirmSafeAppsTxDetails } from './ConfirmSafeAppsTxDetails'
import { TxFlowType } from '@/services/analytics'

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
  const { step, nextStep, prevStep } = useTxStepper(undefined, TxFlowType.SAFE_APPS_TX)

  const origin = useMemo(() => getTxOrigin(data.app), [data.app])

  const steps = useMemo<TxStep[]>(
    () => [
      {
        txLayoutProps: { title: 'Confirm transaction' },
        content: <ReviewSafeAppsTx key={0} safeAppsTx={data} origin={origin} onSubmit={() => nextStep(undefined)} />,
      },
      {
        txLayoutProps: { title: 'Confirm transaction details', fixedNonce: true },
        content: <ConfirmSafeAppsTxDetails key={1} safeAppsTx={data} onSubmit={onSubmit} showMethodCall />,
      },
    ],
    [nextStep, data, onSubmit, origin],
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
