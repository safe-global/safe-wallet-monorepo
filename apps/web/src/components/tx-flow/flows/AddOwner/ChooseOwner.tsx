import { useForm, FormProvider, Controller } from 'react-hook-form'

import AddressBookInput from '@/components/common/AddressBookInput'
import { useSafeShieldForAddressPoisoning } from '@/features/safe-shield/SafeShieldContext'
import NameInput from '@/components/common/NameInput'
import { useAddressResolver } from '@/hooks/useAddressResolver'
import useSafeInfo from '@/hooks/useSafeInfo'
import {
  uniqueAddress,
  addressIsNotCurrentSafe,
  addressIsNotReserved,
  validateThreshold,
} from '@safe-global/utils/utils/validation'
import { getContractErrorMessage } from '@safe-global/utils/services/exceptions/contractErrors'
import type { AddOwnerFlowProps } from '.'
import type { ReplaceOwnerFlowProps } from '../ReplaceOwner'
import EthHashInfo from '@/components/common/EthHashInfo'
import {
  ChooseOwnerThresholdSelectView,
  ChooseOwnerView,
} from '@views/components/tx-flow/flows/AddOwner/ChooseOwnerView'

type FormData = Pick<AddOwnerFlowProps | ReplaceOwnerFlowProps, 'newOwner' | 'threshold'>

export enum ChooseOwnerMode {
  REPLACE,
  ADD,
}

export const ChooseOwner = ({
  params,
  onSubmit,
  mode,
}: {
  params: AddOwnerFlowProps | ReplaceOwnerFlowProps
  onSubmit: (data: FormData) => void
  mode: ChooseOwnerMode
}) => {
  const { safe, safeAddress } = useSafeInfo()

  const formMethods = useForm<FormData>({
    defaultValues: params,
    mode: 'onChange',
  })
  const { handleSubmit, formState, watch, control } = formMethods
  const isValid = Object.keys(formState.errors).length === 0 // do not use formState.isValid because names can be empty

  // Inline validation for the GS204/GS203 on-chain reverts (WA-3005 Bucket A):
  // duplicate signer, the Safe itself, and reserved (zero/sentinel) addresses
  // are blocked here so they never reach signing.
  const notAlreadyOwner = uniqueAddress(
    safe.owners.map((owner) => owner.value),
    getContractErrorMessage('GS204'),
  )
  const notCurrentSafe = addressIsNotCurrentSafe(safeAddress)
  const notReserved = addressIsNotReserved()
  const combinedValidate = (address: string) =>
    notAlreadyOwner(address) || notCurrentSafe(address) || notReserved(address)

  const address = watch('newOwner.address')

  // Copilot address-poisoning check for the new owner (poisoning-only entry in the recipient card)
  useSafeShieldForAddressPoisoning([address])

  const { name, ens, resolving } = useAddressResolver(address)

  // Address book, ENS
  const fallbackName = name || ens

  const onFormSubmit = handleSubmit((formData: FormData) => {
    onSubmit({
      ...formData,
      newOwner: {
        ...formData.newOwner,
        name: formData.newOwner.name || fallbackName,
      },
      threshold: formData.threshold,
    })
  })

  const newNumberOfOwners = safe.owners.length + (!params.removedOwner ? 1 : 0)

  // Derived rather than read from RHF: the owner set can change on-chain while
  // the flow is open, which does not re-run the threshold field's validation.
  const thresholdError = validateThreshold(watch('threshold'), newNumberOfOwners)

  return (
    <FormProvider {...formMethods}>
      <ChooseOwnerView
        onSubmit={onFormSubmit}
        removedOwner={params.removedOwner}
        fallbackName={fallbackName}
        resolving={resolving}
        showThreshold={mode === ChooseOwnerMode.ADD}
        thresholdSelect={
          <Controller
            control={control}
            name="threshold"
            rules={{ validate: (value) => validateThreshold(value, newNumberOfOwners) }}
            render={({ field }) => (
              <ChooseOwnerThresholdSelectView
                value={field.value}
                onValueChange={field.onChange}
                ownerCount={safe.owners.length}
                newNumberOfOwners={newNumberOfOwners}
                hasRemovedOwner={!!params.removedOwner}
                hasError={!!thresholdError}
              />
            )}
          />
        }
        newNumberOfOwners={newNumberOfOwners}
        thresholdError={thresholdError}
        isValid={isValid}
        renderAddress={(props) => <EthHashInfo {...props} />}
        renderNameInput={(props) => <NameInput {...props} />}
        renderAddressInput={(props) => <AddressBookInput {...props} validate={combinedValidate} />}
      />
    </FormProvider>
  )
}
