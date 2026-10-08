import { useForm, FormProvider, useFieldArray, Controller } from 'react-hook-form'
import type { ReactElement } from 'react'

import { RecoverAccountFlowFields } from '.'
import AddressBookInput from '@/components/common/AddressBookInput'
import { useSafeShieldForAddressPoisoning } from '@/features/safe-shield/SafeShieldContext'
import useSafeInfo from '@/hooks/useSafeInfo'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { addressIsNotReserved, validateThreshold } from '@safe-global/utils/utils/validation'
import { getContractErrorMessage } from '@safe-global/utils/services/exceptions/contractErrors'
import type { RecoverAccountFlowProps } from '.'
import { type AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import {
  RecoverAccountFlowSetupView,
  RecoverAccountThresholdSelectView,
} from '@views/components/tx-flow/flows/RecoverAccount/RecoverAccountFlowSetupView'

export function _isSameSetup({
  oldOwners,
  oldThreshold,
  newOwners,
  newThreshold,
}: {
  oldOwners: Array<AddressInfo>
  oldThreshold: number
  newOwners: Array<AddressInfo>
  newThreshold: number
}): boolean {
  if (oldThreshold !== newThreshold) {
    return false
  }

  if (oldOwners.length !== newOwners.length) {
    return false
  }

  return oldOwners.every((oldOwner) => {
    return newOwners.some((newOwner) => sameAddress(oldOwner.value, newOwner.value))
  })
}

export function _validateNewOwner({
  value,
  safeAddress,
  newOwners,
}: {
  value: string
  safeAddress: string
  newOwners: Array<AddressInfo>
}): string | undefined {
  // Blocks the GS203/GS204 on-chain reverts before signing (WA-3005 Bucket A)
  const reservedError = addressIsNotReserved()(value)
  if (reservedError) {
    return reservedError
  }

  if (sameAddress(value, safeAddress)) {
    return 'Cannot use Safe account itself as signer.'
  }

  const isDuplicate = newOwners.filter((owner) => sameAddress(owner.value, value)).length > 1
  if (isDuplicate) {
    return getContractErrorMessage('GS204')
  }
}

export function RecoverAccountFlowSetup({
  params,
  onSubmit,
}: {
  params: RecoverAccountFlowProps
  onSubmit: (formData: RecoverAccountFlowProps) => void
}): ReactElement {
  const { safeAddress, safe } = useSafeInfo()

  const formMethods = useForm<RecoverAccountFlowProps>({
    defaultValues: params,
    mode: 'onChange',
  })

  const newOwners = formMethods.watch(RecoverAccountFlowFields.owners)

  // Copilot address-poisoning check for the recovery signers.
  useSafeShieldForAddressPoisoning(newOwners.map((owner) => owner.value))
  const newThreshold = formMethods.watch(RecoverAccountFlowFields.threshold)

  const { fields, append, remove } = useFieldArray({
    control: formMethods.control,
    name: RecoverAccountFlowFields.owners,
  })

  const isSameSetup = _isSameSetup({
    oldOwners: safe.owners,
    oldThreshold: safe.threshold,
    newOwners,
    newThreshold: Number(newThreshold),
  })

  // Derived rather than read from RHF: removing a signer row does not re-run the
  // threshold field's validation, which is exactly when it goes stale.
  const thresholdError = validateThreshold(newThreshold, fields.length)

  return (
    <FormProvider {...formMethods}>
      <RecoverAccountFlowSetupView
        onSubmit={formMethods.handleSubmit(onSubmit)}
        signerCount={fields.length}
        renderSignerInput={(index, props) => (
          <AddressBookInput
            {...props}
            name={`${RecoverAccountFlowFields.owners}.${index}.value`}
            key={fields[index].id}
            validate={(value) => _validateNewOwner({ value, safeAddress, newOwners })}
          />
        )}
        onRemoveSigner={remove}
        onAddSigner={() => append({ value: '' })}
        thresholdSelect={
          <Controller
            control={formMethods.control}
            name={RecoverAccountFlowFields.threshold}
            rules={{ validate: (value) => validateThreshold(value, fields.length) }}
            render={({ field }) => (
              <RecoverAccountThresholdSelectView
                value={field.value}
                onValueChange={field.onChange}
                signerCount={fields.length}
                hasError={!!thresholdError}
              />
            )}
          />
        }
        thresholdError={thresholdError}
        isSameSetup={isSameSetup}
      />
    </FormProvider>
  )
}
