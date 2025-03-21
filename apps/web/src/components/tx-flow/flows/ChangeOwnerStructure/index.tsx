import type { ReactElement } from 'react'

import TxLayout from '@/components/tx-flow/common/TxLayout'
import useTxStepper from '@/components/tx-flow/useTxStepper'
import SaveAddressIcon from '@/public/images/common/save-address.svg'
import useSafeInfo from '@/hooks/useSafeInfo'
import { SetupStructure } from './SetupStructure'
import { ReviewStructure } from './ReviewStructure'
import type { NamedAddress } from '@/components/new-safe/create/types'

export enum ChangeOwnerStructureFormFields {
  threshold = 'threshold',
  owners = 'owners',
}

export type ChangeOwnerStructureForm = {
  [ChangeOwnerStructureFormFields.threshold]: number
  [ChangeOwnerStructureFormFields.owners]: Array<NamedAddress>
}

export function ChangeOwnerStructureFlow(): ReactElement {
  const { safe } = useSafeInfo()

  const { data, step, nextStep, prevStep } = useTxStepper<ChangeOwnerStructureForm>({
    [ChangeOwnerStructureFormFields.threshold]: safe.threshold,
    [ChangeOwnerStructureFormFields.owners]: safe.owners.map((owner) => {
      return {
        address: owner.value,
        name: '',
      }
    }),
  })

  const steps = [
    <SetupStructure key={0} params={data} onSubmit={(formData) => nextStep(formData)} />,
    <ReviewStructure key={1} params={data} />,
  ]

  return (
    <TxLayout
      title={step === 0 ? 'New transaction' : 'Confirm transaction'}
      subtitle="Change owner structure"
      icon={SaveAddressIcon}
      step={step}
      onBack={prevStep}
    >
      {steps}
    </TxLayout>
  )
}
