import { RemoveSpendingLimitReview } from './RemoveSpendingLimitReview'
import type { SpendingLimitState } from '@/store/spendingLimitsSlice'
import SaveAddressIcon from '@/public/images/common/save-address.svg'
import { useMemo } from 'react'
import { TxFlowType } from '@/services/analytics'
import { TxFlow } from '@/features/tx-flow/components/TxFlow'
import type ReviewTransaction from '@/components/tx/ReviewTransactionV2'

const RemoveSpendingLimitFlow = ({ spendingLimit }: { spendingLimit: SpendingLimitState }) => {
  const ReviewTransactionComponent = useMemo<typeof ReviewTransaction>(
    () =>
      function ReviewRemoveSpendingLimit(props) {
        return <RemoveSpendingLimitReview params={spendingLimit} {...props} />
      },
    [spendingLimit],
  )

  return (
    <TxFlow
      subtitle="Remove spending limit"
      eventCategory={TxFlowType.REMOVE_SPENDING_LIMIT}
      icon={SaveAddressIcon}
      ReviewTransactionComponent={ReviewTransactionComponent}
    />
  )
}

export default RemoveSpendingLimitFlow
