import { useContext } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import type { ReactElement } from 'react'

import useSafeInfo from '@/hooks/useSafeInfo'
import { SignersStructureView } from './SignersStructureView'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { TxFlowContext } from '../../TxFlowProvider'
import { ManageSignersFormFields } from '.'
import type { ManageSignersForm } from '.'
import type { TxFlowContextType } from '../../TxFlowProvider'
import { useLoadFeature } from '@/features/__core__'
import {
  CloudCosignerFeature,
  addCloudCosigner,
  hasCloudCosigner,
  removeCloudCosigner,
  useCloudCosignerInfo,
} from '@/features/cloud-cosigner'

export function SignersStructure(): ReactElement {
  const { data } = useContext<TxFlowContextType<ManageSignersForm>>(TxFlowContext)
  const { safe } = useSafeInfo()

  const formMethods = useForm<ManageSignersForm>({
    defaultValues: data,
    mode: 'onChange',
  })
  const fieldArray = useFieldArray<ManageSignersForm>({
    control: formMethods.control,
    name: ManageSignersFormFields.owners,
  })

  const newOwners = formMethods.watch(ManageSignersFormFields.owners)
  const newThreshold = formMethods.watch(ManageSignersFormFields.threshold)

  const { CloudCosignerOption } = useLoadFeature(CloudCosignerFeature)
  const { address: cosignerAddress } = useCloudCosignerInfo()

  // Toggling the cosigner adds or removes its owner row and moves the threshold with it, so the
  // human signers' quorum stays what the user picked.
  const onToggleCosigner = (checked: boolean, address: string) => {
    const next = checked
      ? addCloudCosigner(newOwners, newThreshold, address)
      : removeCloudCosigner(newOwners, newThreshold, address)
    fieldArray.replace(next.owners)
    formMethods.setValue(ManageSignersFormFields.threshold, next.threshold)
  }

  const onAdd = () => {
    fieldArray.append({ name: '', address: '' }, { shouldFocus: true })
  }

  const onRemove = (index: number) => {
    fieldArray.remove(index)
    // newOwners does not update immediately after removal
    const newOwnersLength = newOwners.length - 1
    if (newThreshold > newOwnersLength) {
      formMethods.setValue(ManageSignersFormFields.threshold, newOwnersLength)
    }
  }

  const isSameOwners =
    newOwners.length === safe.owners.length &&
    newOwners.every((newOwner) => {
      return safe.owners.some((currentOwner) => sameAddress(currentOwner.value, newOwner.address))
    })
  const isSameThreshold = safe.threshold === newThreshold

  return (
    <SignersStructureView
      formMethods={formMethods}
      fieldArray={fieldArray}
      newOwners={newOwners}
      onRemove={onRemove}
      onAdd={onAdd}
      isSameSetup={isSameOwners && isSameThreshold}
      extraSignerControls={
        <CloudCosignerOption
          checked={hasCloudCosigner(newOwners, cosignerAddress)}
          onCheckedChange={onToggleCosigner}
        />
      }
    />
  )
}
