import SaveAddressIcon from '@/public/images/common/save-address.svg'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { TxFlowType } from '@/services/analytics/types'
import { TxFlow } from '../../TxFlow'
import { TxFlowStep } from '../../TxFlowStep'
import type { NewSpendingLimitFlowProps } from '@/features/spending-limits/public/types'
import CreateSpendingLimit from '@/features/spending-limits/public/components/CreateSpendingLimit'
import ReviewSpendingLimit from '@/features/spending-limits/public/components/ReviewSpendingLimit'
import { CustomTokensProvider } from '@/components/common/CustomTokensProvider'

const defaultValues: NewSpendingLimitFlowProps = {
  beneficiary: '',
  tokenAddress: ZERO_ADDRESS,
  amount: '',
  resetTime: '0',
}

const NewSpendingLimitFlow = () => {
  return (
    <CustomTokensProvider>
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
    </CustomTokensProvider>
  )
}

export default NewSpendingLimitFlow
