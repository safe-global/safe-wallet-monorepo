import { type Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import SpendingLimitRow from '@/features/spending-limits/public/components/SpendingLimitRow'

type SpendingLimitRowWrapperProps = {
  availableAmount: bigint
  selectedToken: Balance['tokenInfo'] | undefined
}

/**
 * Wrapper component that lazy-loads SpendingLimitRow from the spending-limits feature.
 * This component should only be rendered when the user can create spending limit transactions,
 * to avoid unnecessary feature loading and render cycles for non-SL Safes.
 */
const SpendingLimitRowWrapper = ({ availableAmount, selectedToken }: SpendingLimitRowWrapperProps) => {
  return <SpendingLimitRow availableAmount={availableAmount} selectedToken={selectedToken} />
}

export default SpendingLimitRowWrapper
