import SaveAddressIcon from '@/public/images/common/save-address.svg'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { TxFlowType } from '@/services/analytics'
import { TxFlow } from '../../TxFlow'
import { TxFlowStep } from '../../TxFlowStep'
import { useLoadFeature } from '@/features/__core__'
import { SpendingLimitsFeature, type NewSpendingLimitFlowProps } from '@/features/spending-limits'
import { NEW_SPENDING_LIMIT_FLOW_COPY as COPY } from '@views/components/tx-flow/flows/NewSpendingLimit/copy'

const defaultValues: NewSpendingLimitFlowProps = {
  beneficiary: '',
  tokenAddress: ZERO_ADDRESS,
  amount: '',
  resetTime: '0',
}

const NewSpendingLimitFlow = () => {
  const { CreateSpendingLimit, ReviewSpendingLimit } = useLoadFeature(SpendingLimitsFeature)

  return (
    <TxFlow
      icon={SaveAddressIcon}
      subtitle={COPY.subtitle}
      ReviewTransactionComponent={ReviewSpendingLimit}
      eventCategory={TxFlowType.SETUP_SPENDING_LIMIT}
      initialData={defaultValues}
    >
      <TxFlowStep title={COPY.stepTitle}>
        <CreateSpendingLimit />
      </TxFlowStep>
    </TxFlow>
  )
}

export default NewSpendingLimitFlow
