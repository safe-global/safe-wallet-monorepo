import { useCallback, useContext, type ReactElement, type ReactNode } from 'react'
import { SafeTxContext } from '@safe-global/views/components/tx-flow/SafeTxContext'
import type { SubmitCallback } from '@/components/tx-flow/TxFlow'
import { TxFlowStep } from '@/components/tx-flow/TxFlowStep'
import ReviewTransaction, { type ReviewTransactionProps } from '@/components/tx/ReviewTransactionV2'
import ReviewTransactionSkeleton from '@/components/tx/ReviewTransactionV2/ReviewTransactionSkeleton'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import GuardStateAlerts from '@safe-global/views/features/spaces/components/Policies/GuardPolicyFlow/Summary/GuardStateAlerts'
import {
  GUARD_POLICY_REVIEW_STEP_TITLE,
  REQUEST_CAP_REACHED_TEXT,
} from '@safe-global/views/features/spaces/components/Policies/GuardPolicyFlow/constants'
import { useStorePolicyRequest } from '../hooks/useStorePolicyRequest'
import { useReplacedPolicies } from '../hooks/useReplacedPolicies'
import { ReplacedPolicyWarning } from '../shared/ReplacedPolicyWarning'
import { useBuildGuardPolicyTransaction, type GuardPolicyBuild } from './hooks/useBuildGuardPolicyTransaction'
import type { GuardPolicyContracts } from './hooks/useGuardPolicyContracts'

export type GuardPolicyReviewProps = ReviewTransactionProps & {
  build: GuardPolicyBuild
  contracts: GuardPolicyContracts
  /** The plain-language summary: callout, Safe and the policy's own cards. */
  summary: ReactNode
}

/**
 * Step 2, "Confirm policy", for every guard policy: the summary on top of the shared transaction review. The
 * batch is built by `useBuildGuardPolicyTransaction` and handed to `SafeTxProvider`; the shared Sign/Execute steps
 * take over from there.
 *
 * A time-locked change (the policy guard is already installed) only publishes its root on-chain, so its
 * configurations are handed to CGW right before the transaction is proposed. That is what lets the Policies page
 * say what a pending request changes and offer Apply once the delay has passed.
 */
const GuardPolicyReview = ({ build, contracts, summary, onSubmit, children }: GuardPolicyReviewProps): ReactElement => {
  const { safeTx, safeTxError } = useContext(SafeTxContext)
  const dispatch = useAppDispatch()
  const storePolicyRequest = useStorePolicyRequest()
  const replaced = useReplacedPolicies(
    contracts.chainId,
    contracts.safeAddress ?? '',
    build.batch?.configurations ?? [],
  )

  useBuildGuardPolicyTransaction(build)

  const handleSubmit = useCallback<SubmitCallback>(
    async (args) => {
      const { batch } = build
      const { chainId, safeAddress } = contracts

      if (batch?.mode === 'request' && safeAddress) {
        // Never blocks the policy: a failed store only leaves the pending row unexplained.
        const stored = await storePolicyRequest({
          chainId,
          safeAddress,
          root: batch.configureRoot,
          configurations: batch.configurations,
        })
        if (!stored.ok && stored.isCapReached) {
          dispatch(
            showNotification({
              message: REQUEST_CAP_REACHED_TEXT,
              variant: 'warning',
              groupKey: 'policy-request-store-cap',
            }),
          )
        }
      }

      onSubmit(args)
    },
    [build, contracts, storePolicyRequest, dispatch, onSubmit],
  )

  if (!safeTx && !safeTxError) {
    return (
      <TxFlowStep title={GUARD_POLICY_REVIEW_STEP_TITLE} hideNonce>
        <ReviewTransactionSkeleton />
      </TxFlowStep>
    )
  }

  return (
    <ReviewTransaction title={GUARD_POLICY_REVIEW_STEP_TITLE} onSubmit={handleSubmit} withDecodedData={false}>
      <div className="flex flex-col gap-3" data-testid="guard-policy-summary">
        <GuardStateAlerts isGuardSet={contracts.isGuardSet} isUnknownGuard={contracts.isUnknownGuard} />
        <ReplacedPolicyWarning policies={replaced} />
        {summary}
      </div>
      {children}
    </ReviewTransaction>
  )
}

export default GuardPolicyReview
