import type { ReactElement } from 'react'
import AppliesToRow from './AppliesToRow'
import PolicyCallout from './PolicyCallout'
import SpenderSummaryCard from './SpenderSummaryCard'
import type { PolicySummaryModel } from './types'

export type PolicySummaryProps = { policy: PolicySummaryModel }

/**
 * The plain-language block at the top of the confirm step: what is granted, to which Safe, and every spender's
 * limits with their own frequency. Purely presentational — WA-3152 builds the transaction the rest of the step shows.
 */
const PolicySummary = ({ policy }: PolicySummaryProps): ReactElement => (
  <div className="flex flex-col gap-3" data-testid="policy-summary">
    <PolicyCallout policy={policy} />
    <AppliesToRow safe={policy.safe} />
    {policy.spenders.map((spender, index) => (
      <SpenderSummaryCard key={`${spender.address}-${index}`} spender={spender} chainId={policy.safe.chainId} />
    ))}
  </div>
)

export default PolicySummary
