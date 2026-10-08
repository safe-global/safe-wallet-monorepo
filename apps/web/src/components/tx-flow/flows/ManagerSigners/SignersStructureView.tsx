import { Controller, FormProvider } from 'react-hook-form'
import { useContext } from 'react'
import type { ReactElement } from 'react'

import OwnerRow from '@/components/new-safe/OwnerRow'
import { useSafeShieldForAddressPoisoning } from '@/features/safe-shield/SafeShieldContext'
import { ManageSignersFormFields } from '.'
import { TxFlowContext } from '../../TxFlowProvider'
import { SETTINGS_EVENTS, SETTINGS_LABELS, trackEvent } from '@/services/analytics'
import type { TxFlowContextType } from '../../TxFlowProvider'
import type { ManageSignersForm } from '.'
import type { UseFormReturn, UseFieldArrayReturn } from 'react-hook-form'
import {
  SignersStructureViewView,
  SignersThresholdSelectView,
} from '@views/components/tx-flow/flows/ManagerSigners/SignersStructureViewView'

type Props = {
  formMethods: UseFormReturn<ManageSignersForm>
  fieldArray: UseFieldArrayReturn<ManageSignersForm, 'owners'>
  newOwners: ManageSignersForm['owners']
  isSameSetup: boolean
  onRemove: (index: number) => void
  onAdd: () => void
}

export function SignersStructureView(props: Props): ReactElement {
  const { onNext } = useContext<TxFlowContextType<ManageSignersForm>>(TxFlowContext)

  // Copilot address-poisoning check for the configured signers.
  useSafeShieldForAddressPoisoning(props.newOwners.map((owner) => owner.address))

  return (
    <FormProvider {...props.formMethods}>
      <SignersStructureViewView
        onSubmit={props.formMethods.handleSubmit(onNext)}
        signerRows={<Signers {...props} />}
        onAdd={props.onAdd}
        thresholdSelect={<Threshold {...props} />}
        ownerCount={props.newOwners.length}
        nextDisabled={props.isSameSetup || !props.formMethods.formState.isValid}
      />
    </FormProvider>
  )
}

function Signers({ fieldArray, onRemove: _onRemove }: Pick<Props, 'fieldArray' | 'onRemove'>): ReactElement {
  const onRemove = (index: number) => {
    _onRemove(index)
    trackEvent({ ...SETTINGS_EVENTS.SETUP.REMOVE_OWNER, label: SETTINGS_LABELS.manage_signers })
  }

  return (
    <>
      {fieldArray.fields.map((field, index) => (
        <OwnerRow
          key={field.id}
          index={index}
          groupName={ManageSignersFormFields.owners}
          removable={fieldArray.fields.length > 1}
          remove={onRemove}
        />
      ))}
    </>
  )
}

function Threshold({ formMethods, newOwners }: Pick<Props, 'formMethods' | 'newOwners'>): ReactElement {
  return (
    <Controller
      control={formMethods.control}
      name="threshold"
      render={({ field }) => {
        const onChange = (value: number | null) => {
          if (value == null) return
          field.onChange(value)
          trackEvent({ ...SETTINGS_EVENTS.SETUP.CHANGE_THRESHOLD, label: SETTINGS_LABELS.manage_signers })
        }

        return <SignersThresholdSelectView value={field.value} onValueChange={onChange} ownerCount={newOwners.length} />
      }}
    />
  )
}
