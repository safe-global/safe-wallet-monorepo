import TxLayout from '@/components/tx-flow/common/TxLayout'
import type { TxStep } from '../../common/TxLayout'
import useTxStepper from '@/components/tx-flow/useTxStepper'
import useSafeInfo from '@/hooks/useSafeInfo'
import { ReviewOwner } from '../AddOwner/ReviewOwner'
import { ChooseOwner, ChooseOwnerMode } from '../AddOwner/ChooseOwner'
import SaveAddressIcon from '@/public/images/common/save-address.svg'
import { ConfirmTxDetails } from '@/components/tx/ConfirmTxDetails'
import { TxFlowType } from '@/services/analytics'

type Owner = {
  address: string
  name?: string
}

export type ReplaceOwnerFlowProps = {
  newOwner: Owner
  removedOwner: Owner
  threshold: number
}

const ReplaceOwnerFlow = ({ address }: { address: string }) => {
  const { safe } = useSafeInfo()

  const defaultValues: ReplaceOwnerFlowProps = {
    newOwner: { address: '' },
    removedOwner: { address },
    threshold: safe.threshold,
  }

  const { data, step, nextStep, prevStep } = useTxStepper<ReplaceOwnerFlowProps>(
    defaultValues,
    TxFlowType.REPLACE_OWNER,
  )

  const steps: TxStep[] = [
    {
      txLayoutProps: { title: 'New transaction' },
      content: (
        <ChooseOwner
          key={0}
          params={data}
          onSubmit={(formData) => nextStep({ ...data, ...formData })}
          mode={ChooseOwnerMode.REPLACE}
        />
      ),
    },
    {
      txLayoutProps: { title: 'Confirm transaction' },
      content: <ReviewOwner key={1} params={data} onSubmit={() => nextStep(data)} />,
    },
    {
      txLayoutProps: { title: 'Confirm transaction details', fixedNonce: true },
      content: <ConfirmTxDetails key={2} onSubmit={() => {}} />,
    },
  ]

  return (
    <TxLayout
      subtitle="Replace signer"
      icon={SaveAddressIcon}
      step={step}
      onBack={prevStep}
      {...(steps?.[step]?.txLayoutProps || {})}
    >
      {steps.map(({ content }) => content)}
    </TxLayout>
  )
}

export default ReplaceOwnerFlow
