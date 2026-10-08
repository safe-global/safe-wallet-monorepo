import type { StepRenderProps } from '@/components/new-safe/CardStepper/useCardStepper'
import type { LoadSafeFormData } from '@/components/new-safe/load'
import { FormProvider, useForm } from 'react-hook-form'
import NameInput from '@/components/common/NameInput'
import NetworkSelector from '@/components/common/NetworkSelector'
import { useMnemonicSafeName } from '@/hooks/useMnemonicName'
import { useAddressResolver } from '@/hooks/useAddressResolver'
import AddressInput from '@/components/common/AddressInput'
import React from 'react'
import { useLazySafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import useChainId from '@/hooks/useChainId'
import { useAppSelector } from '@/store'
import { selectAddedSafes } from '@/store/addedSafesSlice'
import { LOAD_SAFE_EVENTS, trackEvent } from '@/services/analytics'
import { SetAddressStepView } from '@views/components/new-safe/load/steps/SetAddressStep/SetAddressStepView'

enum Field {
  name = 'name',
  address = 'address',
}

type FormData = {
  [Field.name]: string
  [Field.address]: string
}

const SetAddressStep = ({ data, onSubmit, onBack }: StepRenderProps<LoadSafeFormData>) => {
  const currentChainId = useChainId()
  const addedSafes = useAppSelector((state) => selectAddedSafes(state, currentChainId))
  const [triggerGetSafe] = useLazySafesGetSafeV1Query()
  const formMethods = useForm<FormData>({
    mode: 'all',
    defaultValues: {
      [Field.name]: data.name,
      [Field.address]: data.address,
    },
  })

  const {
    handleSubmit,
    formState: { errors, isValid },
    watch,
    getValues,
  } = formMethods

  const safeAddress = watch(Field.address)
  const randomName = useMnemonicSafeName()
  const { ens, name, resolving } = useAddressResolver(safeAddress)

  // Address book, ENS, mnemonic
  const fallbackName = name || ens || randomName

  const validateSafeAddress = async (address: string) => {
    if (addedSafes && Object.keys(addedSafes).includes(address)) {
      return 'Safe account is already added'
    }

    try {
      const result = await triggerGetSafe({ chainId: currentChainId, safeAddress: address }).unwrap()
      if (!result) {
        return 'Address given is not a valid Safe account address'
      }
    } catch (error) {
      return 'Address given is not a valid Safe account address'
    }
  }

  const onFormSubmit = handleSubmit((data: FormData) => {
    onSubmit({
      ...data,
      [Field.name]: data[Field.name] || fallbackName,
    })

    if (data[Field.name]) {
      trackEvent(LOAD_SAFE_EVENTS.NAME_SAFE)
    }
  })

  const handleBack = () => {
    const formData = getValues()
    onBack({
      ...formData,
      [Field.name]: formData.name || fallbackName,
    })
  }

  return (
    <FormProvider {...formMethods}>
      <SetAddressStepView
        onSubmit={onFormSubmit}
        onBack={handleBack}
        isValid={isValid}
        nameError={errors?.[Field.name]?.message}
        fallbackName={fallbackName}
        resolving={resolving}
        renderNameInput={(props) => <NameInput name={Field.name} {...props} />}
        renderNetworkSelector={(props) => <NetworkSelector {...props} />}
        renderAddressInput={(props) => <AddressInput validate={validateSafeAddress} name={Field.address} {...props} />}
      />
    </FormProvider>
  )
}

export default SetAddressStep
