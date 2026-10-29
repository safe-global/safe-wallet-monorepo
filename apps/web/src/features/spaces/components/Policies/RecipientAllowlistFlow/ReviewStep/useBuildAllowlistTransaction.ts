import { useContext, useEffect, useMemo, useState } from 'react'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import { SafeTxContext } from '@safe-global/views/components/tx-flow/SafeTxContext'
import {
  GUARD_READ_ERROR,
  GUARD_UNAVAILABLE_ERROR,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import type { AllowlistRule } from '../types'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { useLoadFeature } from '@/features/__core__'
import {
  PolicyGuardFeature,
  usePolicyGuard,
  type AllowlistSetup,
  type PolicyGuardState,
  type PolicyGuardTarget,
} from '@/features/policy-guard'
import { getPolicyGuardAddress } from '@/features/policy-guard/services'
import { createMultiSendCallOnlyTx } from '@/services/tx/tx-sender/create'

type BuiltAllowlist = AllowlistSetup & { guardState: PolicyGuardState }

/** Returns the installed setup only once its tx is set, so the review and the CGW save always match it. */
export const useBuildAllowlistTransaction = (rules: AllowlistRule[]): Partial<BuiltAllowlist> => {
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)
  const scope = useSafeScope()
  const { buildAllowlistConfigurations, clearGuardExitConfigurations, createAllowlistSetupTxs, $isReady } =
    useLoadFeature(PolicyGuardFeature)
  const [built, setBuilt] = useState<BuiltAllowlist>()

  const chainId = scope?.chainId
  const safeAddress = scope?.safeAddress
  const target = useMemo(() => (chainId && safeAddress ? { chainId, safeAddress } : undefined), [chainId, safeAddress])
  const { state: readState, error } = usePolicyGuard(target)

  // Each new Safe transaction re-reads the guard and clears `state` meanwhile, so the last settled one is kept per Safe.
  const readKey = readState ? JSON.stringify(readState) : undefined
  const [settled, setSettled] = useState<{ target?: PolicyGuardTarget; key: string }>()
  if (readKey && (settled?.key !== readKey || settled?.target !== target)) setSettled({ target, key: readKey })
  const stateKey = settled && settled.target === target && (readState || !error) ? settled.key : undefined
  const state = useMemo(() => (stateKey ? (JSON.parse(stateKey) as PolicyGuardState) : undefined), [stateKey])

  const sdk = scope?.sdk
  const rulesKey = JSON.stringify(rules)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by value so an equal rules array doesn't rebuild
  const stableRules = useMemo(() => rules, [rulesKey])

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

    let setup: AllowlistSetup
    try {
      const configurations = [
        ...clearGuardExitConfigurations(safeAddress),
        ...buildAllowlistConfigurations(chainId, stableRules),
      ]
      setup = createAllowlistSetupTxs({ chainId, safeAddress, guardAddress, guardState: state, configurations })
    } catch (e) {
      setSafeTxError(asError(e))
      return
    }

    // A build that finishes after the inputs changed must not overwrite the newer one.
    let isStale = false
    createMultiSendCallOnlyTx(setup.txs, scope)
      .then((tx) => {
        if (isStale) return
        setSafeTx(tx)
        setBuilt({ ...setup, guardState: state })
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
    stableRules,
    sdk,
    chainId,
    safeAddress,
    $isReady,
    buildAllowlistConfigurations,
    clearGuardExitConfigurations,
    createAllowlistSetupTxs,
    setSafeTx,
    setSafeTxError,
  ])

  return built ?? {}
}
