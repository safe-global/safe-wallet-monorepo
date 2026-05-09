import { type Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { useLoadFeature } from '@/features/__core__'
import { SpendingLimitsFeature } from '@/features/spending-limits'

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
  const { SpendingLimitRow } = useLoadFeature(SpendingLimitsFeature)

  return <SpendingLimitRow availableAmount={availableAmount} selectedToken={selectedToken} />
}

export default SpendingLimitRowWrapper
