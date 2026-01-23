import { useContext } from 'react'
import { TxFlow } from '@/features/tx-flow/components/TxFlow'
import { TxFlowContext } from '@/features/tx-flow/contexts/TxFlowProvider'
import { TxFlowType } from '@/services/analytics'
import { ReviewRemoveGuard } from './ReviewRemoveGuard'
import { type ReviewTransactionProps } from '@/components/tx/ReviewTransactionV2'

export type RemoveGuardFlowProps = {
  address: string
}

const ReviewRemoveGuardStep = (props: ReviewTransactionProps) => {
  const { data } = useContext(TxFlowContext)
  return <ReviewRemoveGuard params={data} {...props} />
}

const RemoveGuardFlow = ({ address }: RemoveGuardFlowProps) => {
  return (
    <TxFlow
      initialData={{ address }}
      subtitle="Remove guard"
      eventCategory={TxFlowType.REMOVE_GUARD}
      ReviewTransactionComponent={ReviewRemoveGuardStep}
    />
  )
}

export default RemoveGuardFlow
