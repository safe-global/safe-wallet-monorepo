import { useEffect, useMemo, useState } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import { type SafeState, useSafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { POLLING_INTERVAL } from '@/config/constants'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useChain } from '@/hooks/useChains'
import { getRpcServiceUrl } from '@/hooks/wallets/rpcServiceUrl'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3ReadOnly'
import { useAppSelector } from '@/store'
import { selectRpc } from '@/store/settingsSlice'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import { getPolicyGuardAddress } from '../services/policyEngineDeployments'
import { isSafeEligibleForAllowlist } from '../services/allowlistAvailability'
import { resolvePolicyGuardState } from '../services/resolvePolicyGuardState'
import { readModuleGuard } from '../services/readModuleGuard'
import type { PolicyGuardState } from '../types'
import { useReadOnlyProvider } from './useReadOnlyProvider'

type GuardedSafe = Pick<SafeState, 'chainId' | 'version' | 'guard' | 'txHistoryTag'>

type ModuleGuardRead = { readKey: string } & ({ moduleGuard: string } | { error: Error })

export type UsePolicyGuardResult = { state?: PolicyGuardState; isLoading: boolean; error?: Error }

const NO_RPC_ERROR = new Error('No RPC is configured for this chain')

export type PolicyGuardTarget = { chainId: string; safeAddress: string }

/** Reads the open Safe by default; pass a target to read any other Safe */
export const usePolicyGuard = (target?: PolicyGuardTarget): UsePolicyGuardResult => {
  const currentSafe = useSafeInfo()
  const currentProvider = useWeb3ReadOnly()
  const targetQuery = useSafesGetSafeV1Query(target ?? skipToken, { pollingInterval: POLLING_INTERVAL })
  const { provider: targetProvider, error: targetProviderError } = useReadOnlyProvider(target?.chainId)
  const targetError = useMemo(
    () =>
      targetQuery.error
        ? new Error(getRtkQueryErrorMessage(targetQuery.error), { cause: targetQuery.error })
        : undefined,
    [targetQuery.error],
  )

  const {
    safe,
    safeAddress,
    safeLoaded,
    safeLoading,
  }: {
    safe: GuardedSafe
    safeAddress: string
    safeLoaded: boolean
    safeLoading: boolean
  } = target
    ? {
        safe: targetQuery.currentData ?? { chainId: target.chainId, version: null, guard: null, txHistoryTag: null },
        safeAddress: target.safeAddress,
        safeLoaded: !!targetQuery.currentData,
        safeLoading: !targetQuery.currentData && targetQuery.isFetching,
      }
    : currentSafe
  const web3ReadOnly = target ? targetProvider : currentProvider
  const chain = useChain(safe.chainId)
  const customRpc = useAppSelector(selectRpc)
  const policyGuardAddress = getPolicyGuardAddress(safe.chainId)
  const eligibility = isSafeEligibleForAllowlist(safe, chain)
  const isUnsupported = !eligibility.eligible && eligibility.reason === 'version-unsupported'
  const shouldRead = safeLoaded && eligibility.eligible
  const customRpcUrl = chain ? customRpc?.[chain.chainId] : undefined
  const hasRpc = useMemo(() => !!chain && !!(customRpcUrl || getRpcServiceUrl(chain.rpcUri)), [chain, customRpcUrl])

  // A new transaction can change both slots, so a read only counts for the tx history it was made at
  const readKey = `${safe.chainId}:${safeAddress}:${safe.txHistoryTag ?? ''}`
  const [retryCount, setRetryCount] = useState(0)

  // CGW Safe info has no module guard field yet, so it is read from the storage slot
  const [read, , loading] = useAsync<ModuleGuardRead>(
    () => {
      if (!shouldRead || !web3ReadOnly) return
      return readModuleGuard(web3ReadOnly, safeAddress).then(
        (moduleGuard) => ({ readKey, moduleGuard }),
        (error) => ({ readKey, error: asError(error) }),
      )
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- retryCount only triggers a re-read
    [shouldRead, web3ReadOnly, safeAddress, readKey, retryCount],
    false,
  )

  // Data is kept across retries; a read for another Safe or an older tx history is ignored
  const currentRead = read?.readKey === readKey ? read : undefined
  const moduleGuard = currentRead && 'moduleGuard' in currentRead ? currentRead.moduleGuard : undefined
  const readError = currentRead && 'error' in currentRead ? currentRead.error : undefined
  const safeError = target && !safeLoaded && !safeLoading ? targetError : undefined
  const providerError = target && shouldRead ? targetProviderError : undefined
  const error = safeError ?? providerError ?? (shouldRead && !hasRpc ? NO_RPC_ERROR : readError)

  const state = useMemo((): PolicyGuardState | undefined => {
    if (!safeLoaded) return
    if (isUnsupported) return { status: 'unsupported' }
    if (!moduleGuard || !policyGuardAddress) return
    return resolvePolicyGuardState({
      txGuard: safe.guard?.value ?? ZERO_ADDRESS,
      moduleGuard,
      policyGuardAddress,
    })
  }, [safeLoaded, isUnsupported, moduleGuard, policyGuardAddress, safe.guard])

  // A partial result may come from an RPC node a block behind the setup transaction
  const shouldRetry = !!readError || state?.status === 'partial'
  useEffect(() => {
    if (!shouldRetry) return
    const timer = setTimeout(() => setRetryCount((count) => count + 1), POLLING_INTERVAL)
    return () => clearTimeout(timer)
  }, [shouldRetry, currentRead])

  return {
    state,
    isLoading: safeLoading || (shouldRead && hasRpc && !providerError && (!web3ReadOnly || loading || !currentRead)),
    error,
  }
}
