import { useContext, useEffect, useMemo } from 'react'
import { useSafeScope } from '@/components/tx-flow/safe-scope'
import { SafeTxContext } from '@/components/tx-flow/SafeTxContext'
import { useLoadFeature } from '@/features/__core__'
import { SpendingLimitsFeature, type SpendingLimitPair, type SpendingLimitState } from '@/features/spending-limits'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useExistingSpendingLimits } from '../ExistingSpendingLimitsProvider'
import useSpendingLimitTokenOptions from '../hooks/useSpendingLimitTokenOptions'
import type { SpendingLimitPolicyFormValues } from '../types'
import { EXISTING_LIMITS_LOAD_ERROR, EXISTING_PAIR_IN_POLICY_ERROR } from '../constants'
import { buildSpendingLimitPairs, findExistingPair } from './buildSpendingLimitPairs'

type BlockerInputs = {
  existingLimitsError: Error | undefined
  pairsError: Error | undefined
  pairs: readonly SpendingLimitPair[] | undefined
  existingLimits: readonly SpendingLimitState[] | undefined
}

/** Why the policy cannot be built at all, as the error the review shows; `undefined` when nothing forbids it. */
const findBuildBlocker = ({
  existingLimitsError,
  pairsError,
  pairs,
  existingLimits,
}: BlockerInputs): Error | undefined => {
  // Building blind over unknown limits could re-add a delegate or skip a reset, so a failed load is final.
  if (existingLimitsError) return new Error(EXISTING_LIMITS_LOAD_ERROR, { cause: existingLimitsError })
  if (pairsError) return pairsError
  // Step 1 hides these pairs; this catches one that slipped through, since editing a limit is WA-3156's flow.
  if (pairs && existingLimits && findExistingPair(pairs, existingLimits)) {
    return new Error(EXISTING_PAIR_IN_POLICY_ERROR)
  }
  return undefined
}

/**
 * Builds the policy's multisend for the Safe picked in step 1 and hands it to `SafeTxProvider`, so the shared
 * Sign/Execute steps take over. It waits until the token options, the Safe, its existing limits and the feature
 * code are all known, rebuilds whenever one of them or the form changes, and drops a build a later run made stale.
 */
export const useBuildPolicyTransaction = (formValues: SpendingLimitPolicyFormValues | undefined): void => {
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)
  const scope = useSafeScope()
  const { safe, safeLoaded } = useSafeInfo()
  const chain = useCurrentChain()
  const { options: tokens, isLoading: tokensLoading, isPopularLoading } = useSpendingLimitTokenOptions()
  const { limits: existingLimits, error: existingLimitsError } = useExistingSpendingLimits()
  const { createSpendingLimitsTx, $isReady } = useLoadFeature(SpendingLimitsFeature)

  const tokensReady = !tokensLoading && !isPopularLoading
  const pairsResult = useMemo(
    () => (formValues && tokensReady ? buildSpendingLimitPairs(formValues, tokens) : undefined),
    [formValues, tokens, tokensReady],
  )
  // A balance poll hands back new token objects and with them a new `pairsResult`. The builder reads only
  // values, so the pairs are keyed by value: otherwise every poll would tear the transaction down and rebuild it.
  const pairsKey = pairsResult?.pairs ? JSON.stringify(pairsResult.pairs) : undefined
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pairs = useMemo(() => pairsResult?.pairs, [pairsKey])
  const pairsError = pairsResult?.error

  const blocker = useMemo(
    () => findBuildBlocker({ existingLimitsError, pairsError, pairs, existingLimits }),
    [existingLimitsError, pairsError, pairs, existingLimits],
  )

  const sdk = scope?.sdk
  const chainId = scope?.chainId
  const moduleCount = safe.modules?.length

  useEffect(() => {
    // The transaction only ever describes the inputs it was built from, so any change to them invalidates it: it is
    // dropped here and only a finished build puts one back. Otherwise a stale one stays signable under a new summary.
    setSafeTx(undefined)
    setSafeTxError(blocker)
    if (blocker || !pairs || !existingLimits || !sdk || !chainId || !chain || !$isReady || !safeLoaded) return

    // A build that finishes after the inputs changed must not overwrite the newer one.
    let isStale = false
    createSpendingLimitsTx(pairs, existingLimits, chainId, chain, safe.modules, safe.deployed, scope)
      .then((tx) => {
        if (!isStale) setSafeTx(tx)
      })
      .catch((e) => {
        if (!isStale) setSafeTxError(e)
      })
    return () => {
      isStale = true
    }
    // `scope` and `safe` are new objects on every Safe poll; the build only depends on the SDK, the chain and the
    // module count, so those stand in for them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    blocker,
    pairs,
    existingLimits,
    sdk,
    chainId,
    chain,
    $isReady,
    safeLoaded,
    moduleCount,
    safe.deployed,
    createSpendingLimitsTx,
    setSafeTx,
    setSafeTxError,
  ])
}
