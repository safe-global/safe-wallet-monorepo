import { useMemo, type ReactElement } from 'react'

import { TxFlowType } from '@/services/analytics'
import { TxFlow } from '../../TxFlow'
import { TxFlowStep } from '../../TxFlowStep'
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

  const defaultValues = useMemo(() => {
    return {
      [ChangeOwnerStructureFormFields.threshold]: safe.threshold,
      [ChangeOwnerStructureFormFields.owners]: safe.owners.map((owner) => {
        return {
          address: owner.value,
          name: '',
        }
      }),
    }
  }, [safe.threshold, safe.owners])

  return (
    <TxFlow
      icon={SaveAddressIcon}
      subtitle="Manage signers"
      ReviewTransactionComponent={ReviewStructure}
      eventCategory={TxFlowType.CHANGE_OWNER_STRUCTURE}
      initialData={defaultValues}
    >
      <TxFlowStep title="New transaction">
        <SetupStructure />
      </TxFlowStep>
    </TxFlow>
  )
}
