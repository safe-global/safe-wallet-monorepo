import type { ReactElement } from 'react'
import AppliesToCard from './AppliesToCard'
import PolicyCallout from './PolicyCallout'
import SpenderSummaryCard from './SpenderSummaryCard'
import type { SpendingLimitSummaryModel } from './types'

export type SpendingLimitSummaryProps = { policy: SpendingLimitSummaryModel }

/** The confirm step's plain-language block. Purely presentational: it renders the model it is handed. */
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
