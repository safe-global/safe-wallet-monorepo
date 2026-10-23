import { useContext, useEffect, useMemo, useState } from 'react'
import type { MetaTransactionData } from '@safe-global/types-kit'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import { SafeTxContext } from '@safe-global/views/components/tx-flow/SafeTxContext'
import {
  GUARD_READ_ERROR,
  GUARD_UNAVAILABLE_ERROR,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import type { AllowlistRule } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/types'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { useLoadFeature } from '@/features/__core__'
import {
  PolicyGuardFeature,
  usePolicyGuard,
  type PolicyConfiguration,
  type PolicyGuardState,
} from '@/features/policy-guard'
import { getPolicyGuardAddress } from '@/features/policy-guard/services'
import { createMultiSendCallOnlyTx } from '@/services/tx/tx-sender/create'

type BuiltAllowlist = {
  guardState: PolicyGuardState
  configurations: PolicyConfiguration[]
  calls: MetaTransactionData[]
}

/** Returns `configurations` and `calls` only once their tx is set, so the review and the CGW save always match it. */
export const useBuildAllowlistTransaction = (rules: AllowlistRule[]): Partial<BuiltAllowlist> => {
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)
  const scope = useSafeScope()
  const { buildAllowlistConfigurations, createAllowlistSetupTxs, $isReady } = useLoadFeature(PolicyGuardFeature)
  const [built, setBuilt] = useState<BuiltAllowlist>()

  const chainId = scope?.chainId
  const safeAddress = scope?.safeAddress
  const target = useMemo(() => (chainId && safeAddress ? { chainId, safeAddress } : undefined), [chainId, safeAddress])
  const { state, error } = usePolicyGuard(target)

  const sdk = scope?.sdk
  // Keyed by value so a re-created but equal rules array does not rebuild the transaction.
  const rulesKey = JSON.stringify(rules)

  useEffect(() => {
    // The transaction only describes the inputs it was built from, so any change drops it and any old error.
    setBuilt(undefined)
    setSafeTx(undefined)
    setSafeTxError(undefined)
    const guardAddress = chainId ? getPolicyGuardAddress(chainId) : undefined
    if (chainId && !guardAddress) {
      setSafeTxError(new Error(GUARD_UNAVAILABLE_ERROR))
      return
    }
    if (!state) {
      if (error) setSafeTxError(new Error(GUARD_READ_ERROR, { cause: error }))
      return
    }
    if (!$isReady || !sdk || !chainId || !safeAddress || !guardAddress) return

    let configurations: PolicyConfiguration[]
    let txs: ReturnType<typeof createAllowlistSetupTxs>
    try {
      configurations = buildAllowlistConfigurations(chainId, JSON.parse(rulesKey))
      txs = createAllowlistSetupTxs({ safeAddress, guardAddress, guardState: state, configurations })
    } catch (e) {
      setSafeTxError(asError(e))
      return
    }

    // A build that finishes after the inputs changed must not overwrite the newer one.
    let isStale = false
    createMultiSendCallOnlyTx(txs, scope)
      .then((tx) => {
        if (isStale) return
        setSafeTx(tx)
        setBuilt({ guardState: state, configurations, calls: txs })
      })
      .catch((e) => {
        if (!isStale) setSafeTxError(asError(e))
      })
    return () => {
      isStale = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `scope` is a new object on every Safe poll
  }, [
    state,
    error,
    rulesKey,
    sdk,
    chainId,
    safeAddress,
    $isReady,
    buildAllowlistConfigurations,
    createAllowlistSetupTxs,
    setSafeTx,
    setSafeTxError,
  ])

  return built ?? {}
}
