import { useContext, useEffect, useMemo, useState } from 'react'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import { SafeTxContext } from '@safe-global/views/components/tx-flow/SafeTxContext'
import {
  EMPTY_ALLOWLIST_ERROR,
  GUARD_NOT_SUPPORTED_ERROR,
  GUARD_READ_ERROR,
  GUARD_UNAVAILABLE_ERROR,
  REMOVAL_TOO_LARGE_ERROR,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import type { AllowlistRule } from '../types'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { usePolicyGuard } from '@/features/policy-guard/public/hooks/usePolicyGuard'
import type {
  AllowlistSetup,
  PolicyGuardState,
  PolicyGuardTarget,
  TokenApprovalToRevoke,
} from '@/features/policy-guard/public/types'
import {
  buildAllowlistChangeConfigurations,
  buildAllowlistConfigurations,
  clearGuardExitConfigurations,
} from '@/features/policy-guard/public/services/allowlistConfigurations'
import { isAllowlistRemovable } from '@/features/policy-guard/public/services/allowlistLimits'
import { createAllowlistSetupTxs } from '@/features/policy-guard/public/services/createAllowlistSetupTxs'
import {
  getPolicyGuardAddress,
  hasPolicyGuardOnChain,
} from '@/features/policy-guard/public/services/policyEngineDeployments'
import { useHasFeature } from '@/hooks/useChains'
import { createMultiSendCallOnlyTx } from '@/services/tx/tx-sender/create'
import { toFormBaseline } from '../utils/allowlistEdit'

type BuiltAllowlist = AllowlistSetup & { guardState: PolicyGuardState }

/**
 * Returns the installed setup only once its tx is set, so the review and the CGW save always match it. With `baseline`,
 * only the edit's changes. A first setup waits until `revokedApprovals` is given.
 */
export const useBuildAllowlistTransaction = (
  rules: AllowlistRule[],
  baseline?: AllowlistRule[],
  baselineGuard?: string,
  revokedApprovals?: TokenApprovalToRevoke[],
): Partial<BuiltAllowlist> => {
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)
  const scope = useSafeScope()
  const isAllowlistEnabled = useHasFeature(FEATURES.POLICY_RECIPIENT_ALLOWLIST) === true
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
  const currentFallbackHandler = scope?.safe?.fallbackHandler?.value
  const rulesKey = JSON.stringify(rules)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by value so an equal rules array doesn't rebuild
  const stableRules = useMemo(() => rules, [rulesKey])
  const baselineKey = baseline ? JSON.stringify(baseline) : undefined
  // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by value, as the rules are
  const formBaseline = useMemo(() => (baseline ? toFormBaseline(baseline) : undefined), [baselineKey])
  // Only a first setup revokes approvals, so only it waits for them and is rebuilt when they change.
  const revokedApprovalsKey =
    state?.status === 'none' && revokedApprovals
      ? JSON.stringify(revokedApprovals.map(({ tokenAddress, spender }) => ({ tokenAddress, spender })))
      : undefined

  useEffect(() => {
    // The transaction only describes the inputs it was built from, so any change drops it and any old error.
    setBuilt(undefined)
    setSafeTx(undefined)
    setSafeTxError(undefined)
    // An edit only requests a change on the guard already holding the rules, never a first setup or a setter.
    const isUnsupportedEdit =
      formBaseline &&
      state &&
      (state.status !== 'known' || !baselineGuard || !sameAddress(state.guardAddress, baselineGuard))
    if (isUnsupportedEdit) {
      setSafeTxError(new Error(GUARD_NOT_SUPPORTED_ERROR))
      return
    }
    const configuredGuard = chainId ? getPolicyGuardAddress(chainId) : undefined
    const isUnavailable = state
      ? state.status === 'none' && !configuredGuard
      : !!chainId && !hasPolicyGuardOnChain(chainId)
    if (isUnavailable) {
      setSafeTxError(new Error(GUARD_UNAVAILABLE_ERROR))
      return
    }
    if (!state) {
      if (error) setSafeTxError(new Error(GUARD_READ_ERROR, { cause: error }))
      return
    }
    const guardAddress = state.status === 'known' || state.status === 'partial' ? state.guardAddress : configuredGuard
    if (!isAllowlistEnabled || !sdk || !chainId || !safeAddress || !guardAddress) return
    if (state.status === 'none' && !revokedApprovalsKey) return

    let setup: AllowlistSetup
    try {
      const configurations = formBaseline
        ? buildAllowlistChangeConfigurations(chainId, formBaseline, stableRules)
        : [...clearGuardExitConfigurations(safeAddress), ...buildAllowlistConfigurations(chainId, stableRules)]
      if (configurations.length === 0) throw new Error(EMPTY_ALLOWLIST_ERROR)
      setup = createAllowlistSetupTxs({
        chainId,
        safeAddress,
        guardAddress,
        guardState: state,
        configurations,
        currentFallbackHandler,
        revokedApprovals: revokedApprovalsKey ? JSON.parse(revokedApprovalsKey) : undefined,
      })
      if (!isAllowlistRemovable(stableRules)) throw new Error(REMOVAL_TOO_LARGE_ERROR)
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
    formBaseline,
    baselineGuard,
    sdk,
    chainId,
    safeAddress,
    currentFallbackHandler,
    revokedApprovalsKey,
    isAllowlistEnabled,
    setSafeTx,
    setSafeTxError,
  ])

  return built ?? {}
}
