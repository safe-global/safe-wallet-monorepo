import useAddressBook from '@/hooks/useAddressBook'
import useWallet from '@/hooks/wallets/useWallet'
import { Controller, FormProvider, useFieldArray, useForm } from 'react-hook-form'
import type { ReactElement } from 'react'

import type { NamedAddress } from '@/components/new-safe/create/types'
import type { StepRenderProps } from '@/components/new-safe/CardStepper/useCardStepper'
import type { NewSafeFormData } from '@/components/new-safe/create'
import type { CreateSafeInfoItem } from '@/components/new-safe/create/CreateSafeInfos'
import { useSafeSetupHints } from '@/components/new-safe/create/steps/OwnerPolicyStep/useSafeSetupHints'
import useSyncSafeCreationStep from '@/components/new-safe/create/useSyncSafeCreationStep'
import { CREATE_SAFE_EVENTS, trackEvent } from '@/services/analytics'
import OwnerRow from '@/components/new-safe/OwnerRow'
import { OwnerPolicyStepView } from '@views/components/new-safe/create/steps/OwnerPolicyStep/OwnerPolicyStepView'

enum OwnerPolicyStepFields {
  owners = 'owners',
  threshold = 'threshold',
}

export type OwnerPolicyStepForm = {
  [OwnerPolicyStepFields.owners]: NamedAddress[]
  [OwnerPolicyStepFields.threshold]: number
}

const OWNER_POLICY_STEP_FORM_ID = 'create-safe-owner-policy-step-form'

const OwnerPolicyStep = ({
  onSubmit,
  onBack,
  data,
  setStep,
  setDynamicHint,
}: StepRenderProps<NewSafeFormData> & {
  setDynamicHint: (hints: CreateSafeInfoItem | undefined) => void
}): ReactElement => {
  const wallet = useWallet()
  const addressBook = useAddressBook()
  const defaultOwnerAddressBookName = wallet?.address ? addressBook[wallet.address] : undefined
  const defaultOwner: NamedAddress = {
    name: defaultOwnerAddressBookName || wallet?.ens || '',
    address: wallet?.address || '',
  }
  useSyncSafeCreationStep(setStep, data.networks)

  const formMethods = useForm<OwnerPolicyStepForm>({
    mode: 'onChange',
    defaultValues: {
      [OwnerPolicyStepFields.owners]: data.owners.length > 0 ? data.owners : [defaultOwner],
      [OwnerPolicyStepFields.threshold]: data.threshold,
    },
  })

  const { handleSubmit, control, watch, formState, getValues, setValue, trigger } = formMethods

  const threshold = watch(OwnerPolicyStepFields.threshold)

  const {
    fields: ownerFields,
    append: appendOwner,
    remove,
  } = useFieldArray({ control, name: OwnerPolicyStepFields.owners })

  const removeOwner = (index: number): void => {
    // Set threshold if it's greater than the number of owners
    setValue(OwnerPolicyStepFields.threshold, Math.min(threshold, ownerFields.length - 1))
    remove(index)
    trigger(OwnerPolicyStepFields.owners)
  }

  const isDisabled = !formState.isValid

  useSafeSetupHints(setDynamicHint, threshold, ownerFields.length)

  const handleBack = () => {
    const formData = getValues()
    onBack({ ...data, ...formData })
  }

  const onFormSubmit = handleSubmit((data) => {
    onSubmit(data)

    trackEvent({
      ...CREATE_SAFE_EVENTS.OWNERS,
      label: data.owners.length,
    })

    trackEvent({
      ...CREATE_SAFE_EVENTS.THRESHOLD,
      label: data.threshold,
    })
  })

  return (
    <FormProvider {...formMethods}>
      <OwnerPolicyStepView
        formId={OWNER_POLICY_STEP_FORM_ID}
        onSubmit={onFormSubmit}
        onBack={handleBack}
        onAddSigner={() => appendOwner({ name: '', address: '' }, { shouldFocus: true })}
        isDisabled={isDisabled}
        ownerRows={ownerFields.map((field, i) => (
          <OwnerRow
            key={field.id}
            index={i}
            removable={i > 0}
            groupName={OwnerPolicyStepFields.owners}
            remove={removeOwner}
          />
        ))}
        ownerCount={ownerFields.length}
        renderThresholdController={(render) => (
          <Controller control={control} name="threshold" render={({ field }) => render(field)} />
        )}
      />
    </FormProvider>
  )
}

export default OwnerPolicyStep
