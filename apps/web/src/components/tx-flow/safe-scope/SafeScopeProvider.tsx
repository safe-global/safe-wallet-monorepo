import { useCallback, useEffect, useMemo, useState, type ReactElement, type ReactNode } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import type Safe from '@safe-global/protocol-kit'
import type { JsonRpcProvider } from 'ethers'
import { useSafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type { ExtendedSafeInfo } from '@safe-global/store/slices/SafeInfo/types'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { POLLING_INTERVAL } from '@/config/constants'
import { initSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import { useChain } from '@/hooks/useChains'
import { trackError } from '@/services/exceptions'
import { useAppSelector } from '@/store'
import { selectRpc } from '@/store/settingsSlice'
import { registerActiveScope } from './activeScope'
import { SafeScopeContext } from './context'
import type { SafeScope, SafeScopeContextValue, SafeScopeTarget } from './types'
import { buildSafeScopeKey } from './utils'

type SafeScopeProviderProps = {
  /** Start with a Safe already selected (e.g. signing an existing transaction). Omit when the flow's first step picks it. */
  initial?: SafeScopeTarget
  children: ReactNode
}

/**
 * Supplies the Safe a Space-level transaction flow operates on.
 *
 * Mount one per flow: closing the flow unmounts it, so nothing leaks between two policies created
 * for different Safes in one session. Every effect below is keyed on the target, so switching Safe
 * mid-flow discards the previous SafeState, provider and SDK before the new ones resolve.
 */
export const SafeScopeProvider = ({ initial, children }: SafeScopeProviderProps): ReactElement => {
  const [target, setTarget] = useState<SafeScopeTarget | undefined>(initial)
  const scopeKey = target ? buildSafeScopeKey(target.chainId, target.safeAddress) : undefined

  // Tell `getAndValidateSafeSDK` a scope is live so a forgotten `scope` argument is logged, not silent.
  useEffect(() => registerActiveScope(), [])

  // 1. SafeState for the target. `currentData` (not `data`) so a previous target's result never shows.
  // `isFetching` is included because RTK Query's `isLoading` is false once ANY result exists — after
  // Safe A resolves and the user switches to B, `isLoading` alone would falsely report `safeLoading=false`
  // while B is still in flight.
  const { currentData, error, isLoading, isFetching } = useSafesGetSafeV1Query(
    target ? { chainId: target.chainId, safeAddress: target.safeAddress } : skipToken,
    { pollingInterval: POLLING_INTERVAL },
  )
  // CGW only serves deployed Safes, so a 200 here IS the deployment proof — same as `useLoadSafeInfo`.
  // Counterfactual (undeployed) Safes are local-only and out of scope for Space flows (see WA-3147).
  const safe = useMemo<ExtendedSafeInfo | undefined>(
    () => (currentData ? { ...currentData, deployed: true } : undefined),
    [currentData],
  )
  const safeError = error ? ('message' in error ? String(error.message) : 'Failed to load safe info') : undefined

  // 2. Read-only provider for the target chain, honouring the user's custom RPC.
  const chain = useChain(target?.chainId ?? '')
  const customRpc = useAppSelector(selectRpc)
  const customRpcUrl = chain ? customRpc?.[chain.chainId] : undefined
  const [web3ReadOnly, setWeb3ReadOnly] = useState<JsonRpcProvider>()

  useEffect(() => {
    setWeb3ReadOnly(undefined)
    if (!chain) return
    let cancelled = false
    // Dynamic import keeps ethers out of the main bundle, same as `useInitWeb3`.
    import('@/hooks/wallets/web3').then(({ createWeb3ReadOnly }) => {
      if (cancelled) return
      setWeb3ReadOnly(createWeb3ReadOnly(chain, customRpcUrl))
    })
    return () => {
      cancelled = true
    }
  }, [chain, customRpcUrl])

  // 3. protocol-kit instance for the target Safe. Inputs mirror `useInitSafeCoreSDK`.
  const sdkInputs = useMemo(() => {
    if (!safe || !web3ReadOnly) return undefined
    return {
      provider: web3ReadOnly,
      chainId: safe.chainId,
      address: safe.address.value,
      version: safe.version,
      implementationVersionState: safe.implementationVersionState,
      implementation: safe.implementation.value,
      isL2Chain: chain?.l2,
      isZkChain: chain?.zk,
    }
    // `safe` itself is intentionally not a dependency: polling returns a new object every 15s.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    safe?.chainId,
    safe?.address.value,
    safe?.version,
    safe?.implementationVersionState,
    safe?.implementation.value,
    web3ReadOnly,
    chain?.l2,
    chain?.zk,
  ])
  const [sdk, setSdk] = useState<Safe>()

  useEffect(() => {
    setSdk(undefined)
    if (!sdkInputs) return
    let cancelled = false
    initSafeSDK(sdkInputs)
      .then((instance) => {
        if (!cancelled) setSdk(instance)
      })
      .catch((e) => {
        if (cancelled) return
        setSdk(undefined)
        trackError(ErrorCodes._105, asError(e).message)
      })
    return () => {
      cancelled = true
    }
  }, [scopeKey, sdkInputs])

  const setScope = useCallback((chainId: string, safeAddress: string) => setTarget({ chainId, safeAddress }), [])
  const clearScope = useCallback(() => setTarget(undefined), [])

  const scope = useMemo<SafeScope | undefined>(() => {
    if (!target || !scopeKey) return undefined
    return {
      chainId: target.chainId,
      safeAddress: target.safeAddress,
      scopeKey,
      safe,
      safeLoaded: safe !== undefined,
      // `isFetching` alone would also be true during every 15s background poll of the SAME target;
      // gating it on `safe === undefined` keeps `safeLoading` true only while a (new) target
      // has nothing to show yet, so scoped consumers don't flicker into loading states on each poll.
      safeLoading: isLoading || (isFetching && safe === undefined),
      safeError,
      chain,
      web3ReadOnly,
      sdk,
    }
  }, [target, scopeKey, safe, isLoading, isFetching, safeError, chain, web3ReadOnly, sdk])

  const value = useMemo<SafeScopeContextValue>(() => ({ scope, setScope, clearScope }), [scope, setScope, clearScope])

  return <SafeScopeContext.Provider value={value}>{children}</SafeScopeContext.Provider>
}

export default SafeScopeProvider
