import React, { useEffect } from 'react'
import { useSafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { FormProvider, useFieldArray, useForm } from 'react-hook-form'

import type { StepRenderProps } from '@/components/new-safe/CardStepper/useCardStepper'
import type { LoadSafeFormData } from '@/components/new-safe/load'
import useChainId from '@/hooks/useChainId'
import type { NamedAddress } from '@/components/new-safe/create/types'
import OwnerRow from '@/components/new-safe/OwnerRow'
import { SafeOwnerStepView } from '@views/components/new-safe/load/steps/SafeOwnerStep/SafeOwnerStepView'

enum Field {
  owners = 'owners',
  threshold = 'threshold',
}

type FormData = {
  [Field.owners]: NamedAddress[]
  [Field.threshold]: number
}

const SafeOwnerStep = ({ data, onSubmit, onBack }: StepRenderProps<LoadSafeFormData>) => {
  const chainId = useChainId()
  const formMethods = useForm<FormData>({
    defaultValues: data,
    mode: 'onChange',
  })
  const {
    handleSubmit,
    setValue,
    control,
    formState: { isValid },
    getValues,
  } = formMethods

  const { fields } = useFieldArray({
    control,
    name: Field.owners,
  })

  const { currentData: safeInfo } = useSafesGetSafeV1Query(
    { chainId, safeAddress: data.address },
    { skip: !data.address },
  )

  useEffect(() => {
    if (!safeInfo) return

    setValue(Field.threshold, safeInfo.threshold)

    const owners = safeInfo.owners.map((owner, i) => ({
      address: owner.value,
      name: getValues(`owners.${i}.name`) || '',
    }))

    setValue(Field.owners, owners)
  }, [getValues, safeInfo, setValue])

  const handleBack = () => {
    onBack(getValues())
  }

  return (
    <FormProvider {...formMethods}>
      <SafeOwnerStepView
        onSubmit={handleSubmit(onSubmit)}
        onBack={handleBack}
        isValid={isValid}
        ownerRows={fields.map((field, index) => (
          <OwnerRow key={field.id} index={index} groupName={Field.owners} readOnly />
        ))}
      />
    </FormProvider>
  )
}

export default SafeOwnerStep
