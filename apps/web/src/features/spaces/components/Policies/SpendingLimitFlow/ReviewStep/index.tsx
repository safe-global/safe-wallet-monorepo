import { useContext, useEffect, useMemo, type ReactElement } from 'react'
import { useSafeScope } from '@/components/tx-flow/safe-scope'
import { SafeTxContext } from '@/components/tx-flow/SafeTxContext'
import { TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { TxFlowStep } from '@/components/tx-flow/TxFlowStep'
import ReviewTransaction, { type ReviewTransactionProps } from '@/components/tx/ReviewTransactionV2'
import ReviewTransactionSkeleton from '@/components/tx/ReviewTransactionV2/ReviewTransactionSkeleton'
import { useLoadFeature } from '@/features/__core__'
import { SpendingLimitsFeature } from '@/features/spending-limits'
import useAddressBook from '@/hooks/useAddressBook'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useExistingSpendingLimits } from '../ExistingSpendingLimitsProvider'
import { useSpendingLimitSafeAccounts } from '../hooks/useSpendingLimitSafeAccounts'
import useSpendingLimitTokenOptions from '../hooks/useSpendingLimitTokenOptions'
import SpendingLimitSummary from '../Summary'
import { toPolicySummaryModel } from '../Summary/toPolicySummaryModel'
import type { SpendingLimitPolicyFormValues } from '../types'
import { EXISTING_LIMITS_LOAD_ERROR, REVIEW_STEP_TITLE } from '../constants'
import { buildSpendingLimitPairs } from './buildSpendingLimitPairs'

/**
 * Step 2: the policy in plain language on top of the shared transaction review. The multisend is built for
 * the Safe picked in step 1 (via SafeScope) as soon as its state, the token options and its existing limits
 * are known, and handed to `SafeTxProvider` so the shared Sign/Execute steps take over.
 */
const ReviewSpendingLimitPolicy = ({ onSubmit, children }: ReviewTransactionProps): ReactElement => {
  const { data } = useContext<TxFlowContextType<SpendingLimitPolicyFormValues>>(TxFlowContext)
  const { safeTx, safeTxError, setSafeTx, setSafeTxError } = useContext(SafeTxContext)
  const scope = useSafeScope()
  const { safe, safeLoaded } = useSafeInfo()
  const chain = useCurrentChain()
  const { accounts } = useSpendingLimitSafeAccounts()
  const { options: tokens, isLoading: tokensLoading } = useSpendingLimitTokenOptions()
  const names = useAddressBook()
  const { limits: existingLimits, error: existingLimitsError } = useExistingSpendingLimits()
  const { createSpendingLimitsTx, $isReady } = useLoadFeature(SpendingLimitsFeature)

  const policy = useMemo(
    () => (data ? toPolicySummaryModel(data, { accounts, tokens, names }) : undefined),
    [data, accounts, tokens, names],
  )

  const pairsResult = useMemo(
    () => (data && !tokensLoading ? buildSpendingLimitPairs(data, tokens) : undefined),
    [data, tokens, tokensLoading],
  )
  // The builder reads values, not references, so the effect is keyed on them.
  const pairsKey = pairsResult?.pairs ? JSON.stringify(pairsResult.pairs) : undefined
  const pairsError = pairsResult?.error
  const sdk = scope?.sdk
  const chainId = scope?.chainId

  useEffect(() => {
    if (existingLimitsError) {
      setSafeTxError(new Error(EXISTING_LIMITS_LOAD_ERROR))
      return
    }
    if (pairsError) {
      setSafeTxError(pairsError)
      return
    }
    if (!pairsResult?.pairs || !sdk || !chainId || !chain || !$isReady || !safeLoaded || !existingLimits) return

    setSafeTxError(undefined)
    createSpendingLimitsTx(pairsResult.pairs, existingLimits, chainId, chain, safe.modules, safe.deployed, scope)
      .then(setSafeTx)
      .catch(setSafeTxError)
    // `pairsKey` stands in for `pairsResult`, `safe.modules?.length` for the polled array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pairsKey,
    pairsError,
    sdk,
    chainId,
    chain,
    $isReady,
    safeLoaded,
    existingLimits,
    existingLimitsError,
    safe.modules?.length,
    safe.deployed,
    createSpendingLimitsTx,
    setSafeTx,
    setSafeTxError,
  ])

  if (!safeTx && !safeTxError) {
    return (
      <TxFlowStep title={REVIEW_STEP_TITLE} hideNonce>
        <ReviewTransactionSkeleton />
      </TxFlowStep>
    )
  }

  return (
    <ReviewTransaction title={REVIEW_STEP_TITLE} onSubmit={onSubmit}>
      {policy && <SpendingLimitSummary policy={policy} />}
      {children}
    </ReviewTransaction>
  )
}

export default ReviewSpendingLimitPolicy
