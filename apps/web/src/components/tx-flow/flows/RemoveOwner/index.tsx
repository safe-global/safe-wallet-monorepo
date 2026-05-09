import useSafeInfo from '@/hooks/useSafeInfo'
import { ReviewRemoveOwner } from './ReviewRemoveOwner'
import SaveAddressIcon from '@/public/images/common/save-address.svg'
import { SetThreshold } from './SetThreshold'
import { useContext } from 'react'
import { TxFlowType } from '@/services/analytics'
import { TxFlowContext } from '../../TxFlowProvider'
import { TxFlow } from '../../TxFlow'
import { TxFlowStep } from '../../TxFlowStep'
import { type ReviewTransactionProps } from '@/components/tx/ReviewTransactionV2'

type Owner = {
  address: string
  name?: string
}

export type RemoveOwnerFlowProps = {
  removedOwner: Owner
  threshold: number
}

const SetThresholdStep = () => {
  const { onNext, data } = useContext(TxFlowContext)
  return <SetThreshold onSubmit={onNext} params={data} />
}

const ReviewOwnerStep = (props: ReviewTransactionProps) => {
  const { data } = useContext(TxFlowContext)
  return <ReviewRemoveOwner params={data} {...props} />
}

const RemoveOwnerFlow = (props: Owner) => {
  const { safe } = useSafeInfo()

  const defaultValues: RemoveOwnerFlowProps = {
    removedOwner: props,
    threshold: Math.min(safe.threshold, safe.owners.length - 1),
  }

  return (
    <TxFlow
      initialData={defaultValues}
      eventCategory={TxFlowType.REMOVE_OWNER}
      icon={SaveAddressIcon}
      subtitle="Remove signer"
      ReviewTransactionComponent={ReviewOwnerStep}
    >
      <TxFlowStep title="New transaction">
        <SetThresholdStep />
      </TxFlowStep>
    </TxFlow>
  )
}

export default RemoveOwnerFlow
