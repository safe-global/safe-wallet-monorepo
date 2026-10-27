import type { ReactElement } from 'react'
import type { Address } from 'viem'
import { PolicyType } from '@safe-global/store/gateway/policies/types'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import type { ReviewTransactionProps } from '@/components/tx/ReviewTransactionV2'
import useSafeInfo from '@/hooks/useSafeInfo'
import EthHashInfo from '@/components/common/EthHashInfo'
import GuardPolicyCallout from '@safe-global/views/features/spaces/components/Policies/GuardPolicyFlow/Summary/GuardPolicyCallout'
import SummaryCard from '@safe-global/views/features/spaces/components/Policies/GuardPolicyFlow/Summary/SummaryCard'
import {
  APPLIES_TO_LABEL,
  MULTISEND_BATCHES_VIA_LABEL,
  MULTISEND_EXPLAINER_TEXT,
  MULTISEND_EXPLAINER_TITLE,
  NO_MULTISEND_ERROR,
} from '@safe-global/views/features/spaces/components/Policies/GuardPolicyFlow/constants'
import GuardPolicyReview from '../../GuardPolicyFlow/GuardPolicyReview'
import { buildGuardPolicy } from '../../GuardPolicyFlow/buildGuardPolicy'
import { useGuardPolicyContracts } from '../../GuardPolicyFlow/hooks/useGuardPolicyContracts'
import { buildMultiSendPolicyBatch } from '../buildBatch'
import { getMultiSendAddress } from '../multiSendAddress'

/** Step 2: what the policy will do, then the shared transaction review. */
const ReviewMultiSendPolicy = (props: ReviewTransactionProps): ReactElement => {
  const contracts = useGuardPolicyContracts(PolicyType.MultiSend)
  const scope = useSafeScope()
  const { safe } = useSafeInfo()

  // The access is pinned to the MultiSend the Safe actually batches through, so it follows the
  // Safe's own version rather than a chain-wide assumption.
  const multiSendAddress = getMultiSendAddress(contracts.chainId, safe?.version)

  const build = multiSendAddress
    ? buildGuardPolicy(contracts, (context, policyContract) =>
        buildMultiSendPolicyBatch({ ...context, policyContract, multiSendAddress: multiSendAddress as Address }),
      )
    : { error: new Error(NO_MULTISEND_ERROR) }

  return (
    <GuardPolicyReview
      {...props}
      build={build}
      contracts={contracts}
      summary={
        <>
          <GuardPolicyCallout title={MULTISEND_EXPLAINER_TITLE} description={MULTISEND_EXPLAINER_TEXT} />

          <SummaryCard label={APPLIES_TO_LABEL} data-testid="multisend-summary-safe">
            {scope && (
              <EthHashInfo address={scope.safeAddress} chainId={scope.chainId} shortAddress={false} hasExplorer />
            )}
          </SummaryCard>

          {multiSendAddress && (
            <SummaryCard label={MULTISEND_BATCHES_VIA_LABEL} data-testid="multisend-summary-contract">
              <EthHashInfo address={multiSendAddress} chainId={contracts.chainId} shortAddress={false} hasExplorer />
            </SummaryCard>
          )}
        </>
      }
    />
  )
}

export default ReviewMultiSendPolicy
