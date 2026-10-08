import type { ReactElement } from 'react'
import PolicyCallout from './PolicyCallout'
import SpenderSummaryCard from './SpenderSummaryCard'
import type { SpendingLimitSummaryModel } from '@views/features/spaces/components/Policies/SpendingLimitFlow/Summary/types'
import { SummaryView } from '@views/features/spaces/components/Policies/SpendingLimitFlow/Summary/SummaryView'

export type SpendingLimitSummaryProps = { policy: SpendingLimitSummaryModel }

/** The confirm step's plain-language block. Purely presentational: it renders the model it is handed. */
const SpendingLimitSummary = ({ policy }: SpendingLimitSummaryProps): ReactElement => (
  <SummaryView
    callout={<PolicyCallout policy={policy} />}
    safe={policy.safe}
    spenderCards={policy.spenders.map((spender, index) => (
      <SpenderSummaryCard key={`${spender.address}-${index}`} spender={spender} chainId={policy.safe.chainId} />
    ))}
  />
)

export default SpendingLimitSummary
