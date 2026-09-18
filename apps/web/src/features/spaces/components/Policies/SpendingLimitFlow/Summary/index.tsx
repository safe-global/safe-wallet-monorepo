import type { ReactElement } from 'react'
import AppliesToCard from './AppliesToCard'
import PolicyCallout from './PolicyCallout'
import SpenderSummaryCard from './SpenderSummaryCard'
import type { SpendingLimitSummaryModel } from './types'

export type SpendingLimitSummaryProps = { policy: SpendingLimitSummaryModel }

/**
 * The plain-language block at the top of the confirm step: what is granted, to which Safe, and every spender's
 * limits with their own frequency. Purely presentational — WA-3152 builds the transaction the rest of the step shows.
 */
const SpendingLimitSummary = ({ policy }: SpendingLimitSummaryProps): ReactElement => (
  <div className="flex flex-col gap-3" data-testid="spending-limit-summary">
    <PolicyCallout policy={policy} />
    <AppliesToCard safe={policy.safe} />
    {policy.spenders.map((spender, index) => (
      <SpenderSummaryCard key={`${spender.address}-${index}`} spender={spender} chainId={policy.safe.chainId} />
    ))}
  </div>
)

export default SpendingLimitSummary
