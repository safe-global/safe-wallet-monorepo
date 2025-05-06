import { useContext } from 'react'
import { TxFlow } from '../../TxFlow'
import { TxFlowContext } from '../../TxFlowProvider'
import { TxFlowType } from '@/services/analytics'
import { ReviewRemoveModule } from './ReviewRemoveModule'
import type ReviewTransaction from '@/components/tx/ReviewTransactionV2'

export type RemoveModuleFlowProps = {
  address: string
}

const ReviewRemoveModuleStep: typeof ReviewTransaction = ({ onSubmit }) => {
  const { data } = useContext(TxFlowContext)
  return <ReviewRemoveModule onSubmit={onSubmit} params={data} />
}

const RemoveModuleFlow = ({ address }: RemoveModuleFlowProps) => {
  return (
    <TxFlow
      initialData={{ address }}
      subtitle="Remove module"
      eventCategory={TxFlowType.REMOVE_MODULE}
      ReviewTransactionComponent={ReviewRemoveModuleStep}
    />
  )
}

export default RemoveModuleFlow
