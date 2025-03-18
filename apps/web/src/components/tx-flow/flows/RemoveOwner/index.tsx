import TxLayout from '@/components/tx-flow/common/TxLayout'
import type { TxStep } from '../../common/TxLayout'
import useSafeInfo from '@/hooks/useSafeInfo'
import useTxStepper from '../../useTxStepper'
import { ReviewRemoveOwner } from './ReviewRemoveOwner'
import SaveAddressIcon from '@/public/images/common/save-address.svg'
import { SetThreshold } from './SetThreshold'
import { useMemo } from 'react'
import { ConfirmTxDetails } from '@/components/tx/ConfirmTxDetails'
import { TxFlowType } from '@/services/analytics'

type Owner = {
  address: string
  name?: string
}

export type RemoveOwnerFlowProps = {
  removedOwner: Owner
  threshold: number
}

const RemoveOwnerFlow = (props: Owner) => {
  const { safe } = useSafeInfo()

  const defaultValues: RemoveOwnerFlowProps = {
    removedOwner: props,
    threshold: Math.min(safe.threshold, safe.owners.length - 1),
  }

  const { data, step, nextStep, prevStep } = useTxStepper<RemoveOwnerFlowProps>(defaultValues, TxFlowType.REMOVE_OWNER)

  const steps = useMemo<TxStep[]>(
    () => [
      {
        txLayoutProps: { title: 'New transaction' },
        content: (
          <SetThreshold key={0} params={data} onSubmit={(formData: any) => nextStep({ ...data, ...formData })} />
        ),
      },
      {
        txLayoutProps: { title: 'Confirm transaction' },
        content: <ReviewRemoveOwner key={1} params={data} onSubmit={() => nextStep(data)} />,
      },
      {
        txLayoutProps: { title: 'Confirm transaction details', fixedNonce: true },
        content: <ConfirmTxDetails key={2} onSubmit={() => {}} />,
      },
    ],
    [nextStep, data],
  )

  return (
    <TxLayout
      subtitle="Remove signer"
      icon={SaveAddressIcon}
      step={step}
      onBack={prevStep}
      {...(steps?.[step]?.txLayoutProps || {})}
    >
      {steps.map(({ content }) => content)}
    </TxLayout>
  )
}

export default RemoveOwnerFlow
