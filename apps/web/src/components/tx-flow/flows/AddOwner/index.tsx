import TxLayout from '@/components/tx-flow/common/TxLayout'
import type { TxStep } from '../../common/TxLayout'
import useTxStepper from '@/components/tx-flow/useTxStepper'
import { ChooseOwner, ChooseOwnerMode } from '@/components/tx-flow/flows/AddOwner/ChooseOwner'
import { ReviewOwner } from '@/components/tx-flow/flows/AddOwner/ReviewOwner'
import SaveAddressIcon from '@/public/images/common/save-address.svg'
import useSafeInfo from '@/hooks/useSafeInfo'
import { ConfirmTxDetails } from '@/components/tx/ConfirmTxDetails'
import { useMemo } from 'react'
import { TxFlowType } from '@/services/analytics'

type Owner = {
  address: string
  name?: string
}

export type AddOwnerFlowProps = {
  newOwner: Owner
  removedOwner?: Owner
  threshold: number
}

const FlowInner = ({ defaultValues }: { defaultValues: AddOwnerFlowProps }) => {
  const { data, step, nextStep, prevStep } = useTxStepper<AddOwnerFlowProps>(defaultValues, TxFlowType.ADD_OWNER)

  const steps = useMemo<TxStep[]>(
    () => [
      {
        txLayoutProps: { title: 'New transaction' },
        content: (
          <ChooseOwner
            key={0}
            params={data}
            onSubmit={(formData) => nextStep({ ...data, ...formData })}
            mode={ChooseOwnerMode.ADD}
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
    ],
    [nextStep, data],
  )

  return (
    <TxLayout
      subtitle="Add signer"
      icon={SaveAddressIcon}
      step={step}
      onBack={prevStep}
      {...(steps?.[step]?.txLayoutProps || {})}
    >
      {steps.map(({ content }) => content)}
    </TxLayout>
  )
}

const AddOwnerFlow = ({ address }: { address?: string }) => {
  const { safe, safeLoading, safeLoaded } = useSafeInfo()

  const defaultValues: AddOwnerFlowProps = {
    newOwner: {
      address: address || '',
      name: '',
    },
    threshold: safe.threshold,
  }

  if (!safeLoaded || safeLoading) return null

  return <FlowInner defaultValues={defaultValues} />
}

export default AddOwnerFlow
