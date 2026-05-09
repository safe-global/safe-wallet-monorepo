import type { SpendingLimitState } from '@/features/spending-limits'
import SaveAddressIcon from '@/public/images/common/save-address.svg'
import { useMemo } from 'react'
import { TxFlowType } from '@/services/analytics'
import { TxFlow } from '../../TxFlow'
import type ReviewTransaction from '@/components/tx/ReviewTransactionV2'
import { useLoadFeature } from '@/features/__core__'
import { SpendingLimitsFeature } from '@/features/spending-limits'

const RemoveSpendingLimitFlow = ({ spendingLimit }: { spendingLimit: SpendingLimitState }) => {
  const { RemoveSpendingLimitReview } = useLoadFeature(SpendingLimitsFeature)

  const ReviewTransactionComponent = useMemo<typeof ReviewTransaction>(
    () =>
      function ReviewRemoveSpendingLimit(props) {
        return <RemoveSpendingLimitReview params={spendingLimit} {...props} />
      },
    [spendingLimit, RemoveSpendingLimitReview],
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
