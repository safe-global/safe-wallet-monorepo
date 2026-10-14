import { useContext, type ReactElement } from 'react'
import { PolicyType } from '@safe-global/store/gateway/policies/types'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import { TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import type { ReviewTransactionProps } from '@/components/tx/ReviewTransactionV2'
import EthHashInfo from '@/components/common/EthHashInfo'
import { Typography } from '@safe-global/views/components/ui/typography'
import GuardPolicyCallout from '@safe-global/views/features/spaces/components/Policies/GuardPolicyFlow/Summary/GuardPolicyCallout'
import SummaryCard from '@safe-global/views/features/spaces/components/Policies/GuardPolicyFlow/Summary/SummaryCard'
import {
  ALLOWED_LABEL,
  APPLIES_TO_LABEL,
  FALLS_BACK_LABEL,
  NOTHING_LABEL,
  SAFE_MANAGEMENT_COPY,
} from '@safe-global/views/features/spaces/components/Policies/GuardPolicyFlow/constants'
import type { SafeManagementFormValues } from '@safe-global/views/features/spaces/components/Policies/GuardPolicyFlow/types'
import GuardPolicyReview from '../../GuardPolicyFlow/GuardPolicyReview'
import { buildGuardPolicy } from '../../GuardPolicyFlow/buildGuardPolicy'
import { useGuardPolicyContracts } from '../../GuardPolicyFlow/hooks/useGuardPolicyContracts'
import { SAFE_MANAGEMENT_FUNCTIONS } from '../contracts'
import { buildSafeManagementBatch } from '../buildBatch'

const FunctionList = ({ labels }: { labels: string[] }): ReactElement => (
  <div className="flex flex-col gap-1">
    {labels.length === 0 ? (
      <Typography variant="paragraph-small" color="muted">
        {NOTHING_LABEL}
      </Typography>
    ) : (
      labels.map((label) => (
        <Typography key={label} variant="paragraph-small">
          {label}
        </Typography>
      ))
    )}
  </div>
)

/** Step 2: what stays allowed and what falls through to the fallback, then the shared review. */
const ReviewSafeManagementPolicy = (props: ReviewTransactionProps): ReactElement => {
  const { data } = useContext<TxFlowContextType<SafeManagementFormValues>>(TxFlowContext)
  const contracts = useGuardPolicyContracts(PolicyType.Allow)
  const scope = useSafeScope()

  const selected = data?.functionIds ?? []
  const allowed = SAFE_MANAGEMENT_FUNCTIONS.filter((fn) => selected.includes(fn.id))
  const fallsBack = SAFE_MANAGEMENT_FUNCTIONS.filter((fn) => !selected.includes(fn.id))

  const build = buildGuardPolicy(contracts, (context, policyContract) =>
    buildSafeManagementBatch({ ...context, policyContract, selectors: allowed.map((fn) => fn.selector) }),
  )

  return (
    <GuardPolicyReview
      {...props}
      type={PolicyType.Allow}
      build={build}
      contracts={contracts}
      summary={
        <>
          <GuardPolicyCallout title={SAFE_MANAGEMENT_COPY.title} description={SAFE_MANAGEMENT_COPY.description} />

          <SummaryCard label={APPLIES_TO_LABEL} data-testid="safe-management-summary-safe">
            {scope && (
              <EthHashInfo address={scope.safeAddress} chainId={scope.chainId} shortAddress={false} hasExplorer />
            )}
          </SummaryCard>

          <SummaryCard label={ALLOWED_LABEL} data-testid="safe-management-summary-allowed">
            <FunctionList labels={allowed.map((fn) => fn.label)} />
          </SummaryCard>

          <SummaryCard label={FALLS_BACK_LABEL} data-testid="safe-management-summary-fallback">
            <FunctionList labels={fallsBack.map((fn) => fn.label)} />
          </SummaryCard>
        </>
      }
    />
  )
}

export default ReviewSafeManagementPolicy
