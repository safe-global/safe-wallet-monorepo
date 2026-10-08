import type { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { ReactElement } from 'react'
import TxLayout from '@/components/tx-flow/common/TxLayout'
import SaveAddressIcon from '@/public/images/common/save-address.svg'
import useTxStepper from '../../useTxStepper'
import { RecoverAccountFlowReview } from './RecoverAccountFlowReview'
import { RecoverAccountFlowSetup } from './RecoverAccountFlowSetup'
import { TxFlowType } from '@/services/analytics'
import { RECOVER_ACCOUNT_FLOW_COPY as COPY } from '@views/components/tx-flow/flows/RecoverAccount/copy'

export enum RecoverAccountFlowFields {
  owners = 'owners',
  threshold = 'threshold',
}

export type RecoverAccountFlowProps = {
  // RHF accept primitive field arrays
  [RecoverAccountFlowFields.owners]: Array<AddressInfo>
  [RecoverAccountFlowFields.threshold]: string
}

function RecoverAccountFlow(): ReactElement {
  const { data, step, nextStep, prevStep } = useTxStepper<RecoverAccountFlowProps>(
    {
      [RecoverAccountFlowFields.owners]: [{ value: '' }],
      [RecoverAccountFlowFields.threshold]: '1',
    },
    TxFlowType.START_RECOVERY,
  )

  const steps = [
    <RecoverAccountFlowSetup key={0} params={data} onSubmit={(formData) => nextStep({ ...data, ...formData })} />,
    <RecoverAccountFlowReview key={1} params={data} />,
  ]

  return (
    <TxLayout
      title={step === 0 ? COPY.setupTitle : COPY.reviewTitle}
      subtitle={COPY.subtitle}
      icon={SaveAddressIcon}
      step={step}
      onBack={prevStep}
      hideNonce
    >
      {steps}
    </TxLayout>
  )
}

export default RecoverAccountFlow
