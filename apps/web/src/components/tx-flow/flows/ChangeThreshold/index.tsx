import SaveAddressIcon from '@/public/images/common/save-address.svg'
import useSafeInfo from '@/hooks/useSafeInfo'
import { ChooseThreshold } from './ChooseThreshold'
import { TxFlowType } from '@/services/analytics'
import { TxFlow } from '../../TxFlow'
import { TxFlowStep } from '../../TxFlowStep'
import { type ReviewTransactionProps } from '@/components/tx/ReviewTransactionV2'
import { useContext } from 'react'
import { TxFlowContext } from '../../TxFlowProvider'
import ReviewChangeThreshold from './ReviewChangeThreshold'

export enum ChangeThresholdFlowFieldNames {
  threshold = 'threshold',
}

export type ChangeThresholdFlowProps = {
  [ChangeThresholdFlowFieldNames.threshold]: number
}

const ReviewThresholdStep = (props: ReviewTransactionProps) => {
  const { data } = useContext(TxFlowContext)

  return <ReviewChangeThreshold params={data} {...props} />
}

const ChangeThresholdFlow = () => {
  const {
    safe: { threshold },
  } = useSafeInfo()

  return (
    <TxFlow
      initialData={{ threshold }}
      icon={SaveAddressIcon}
      subtitle="Change threshold"
      eventCategory={TxFlowType.CHANGE_THRESHOLD}
      ReviewTransactionComponent={ReviewThresholdStep}
    >
      <TxFlowStep title="New transaction">
        <ChooseThreshold />
      </TxFlowStep>
    </TxFlow>
  )
}

export default ChangeThresholdFlow
