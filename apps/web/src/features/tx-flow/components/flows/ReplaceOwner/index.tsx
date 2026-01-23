import { ChooseOwner, ChooseOwnerMode } from '@/features/tx-flow/components/flows/AddOwner/ChooseOwner'
import { ReviewOwner } from '@/features/tx-flow/components/flows/AddOwner/ReviewOwner'
import SaveAddressIcon from '@/public/images/common/save-address.svg'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useContext } from 'react'
import { TxFlowType } from '@/services/analytics'
import { TxFlow } from '@/features/tx-flow/components/TxFlow'
import { TxFlowStep } from '@/features/tx-flow/components/TxFlowStep'
import { TxFlowContext } from '@/features/tx-flow/contexts/TxFlowProvider'
import { type ReviewTransactionProps } from '@/components/tx/ReviewTransactionV2'

type Owner = {
  address: string
  name?: string
}

export type ReplaceOwnerFlowProps = {
  newOwner: Owner
  removedOwner: Owner
  threshold: number
}

const ChooseOwnerStep = () => {
  const { onNext, data } = useContext(TxFlowContext)

  return <ChooseOwner onSubmit={onNext} params={data} mode={ChooseOwnerMode.REPLACE} />
}

const ReviewOwnerStep = (props: ReviewTransactionProps) => {
  const { data } = useContext(TxFlowContext)

  return <ReviewOwner params={data} {...props} />
}

const ReplaceOwnerFlow = ({ address }: { address: string }) => {
  const {
    safe: { threshold },
    safeLoaded,
  } = useSafeInfo()

  const defaultValues: ReplaceOwnerFlowProps = {
    newOwner: { address: '' },
    removedOwner: { address },
    threshold,
  }

  if (!safeLoaded) return null

  return (
    <TxFlow
      initialData={defaultValues}
      eventCategory={TxFlowType.REPLACE_OWNER}
      icon={SaveAddressIcon}
      subtitle="Replace signer"
      ReviewTransactionComponent={ReviewOwnerStep}
    >
      <TxFlowStep title="New transaction">
        <ChooseOwnerStep />
      </TxFlowStep>
    </TxFlow>
  )
}

export default ReplaceOwnerFlow
