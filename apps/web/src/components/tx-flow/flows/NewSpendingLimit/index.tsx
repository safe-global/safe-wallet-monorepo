import SaveAddressIcon from '@/public/images/common/save-address.svg'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import { TxFlowType } from '@/services/analytics'
import { TxFlow } from '../../TxFlow'
import { TxFlowStep } from '../../TxFlowStep'
import { useLoadFeature } from '@/features/__core__'
import { SpendingLimitsFeature, type NewSpendingLimitFlowProps } from '@/features/spending-limits'

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
      subtitle="Spending limit"
      ReviewTransactionComponent={ReviewSpendingLimit}
      eventCategory={TxFlowType.SETUP_SPENDING_LIMIT}
      initialData={defaultValues}
    >
      <TxFlowStep title="New transaction">
        <CreateSpendingLimit />
      </TxFlowStep>
    </TxFlow>
  )
}

export default NewSpendingLimitFlow
