import type { ReactElement } from 'react'
import LimitSummaryRow from './LimitSummaryRow'
import type { SpenderSummary } from '@views/features/spaces/components/Policies/SpendingLimitFlow/Summary/types'
import { SpenderSummaryCardView } from '@views/features/spaces/components/Policies/SpendingLimitFlow/Summary/SpenderSummaryCardView'

type SpenderSummaryCardProps = {
  spender: SpenderSummary
  /** The Safe's chain: address-book lookup and reset-period wording key off it. */
  chainId: string
}

const SpenderSummaryCard = ({ spender, chainId }: SpenderSummaryCardProps): ReactElement => (
  <SpenderSummaryCardView
    spender={spender}
    chainId={chainId}
    limits={spender.limits.map((limit, index) => (
      <LimitSummaryRow key={`${limit.token.address}-${index}`} limit={limit} chainId={chainId} />
    ))}
  />
)

export default SpenderSummaryCard
