import { type Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import SpendingLimitRow from '@/features/spending-limits/public/components/SpendingLimitRow'

type SpendingLimitRowWrapperProps = {
  availableAmount: bigint
  selectedToken: Balance['tokenInfo'] | undefined
}

// Render only when the user can create spending limit transactions.
const SpendingLimitRowWrapper = ({ availableAmount, selectedToken }: SpendingLimitRowWrapperProps) => {
  return <SpendingLimitRow availableAmount={availableAmount} selectedToken={selectedToken} />
}

export default SpendingLimitRowWrapper
