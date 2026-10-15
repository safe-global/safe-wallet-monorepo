import { useMemo } from 'react'
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

type ModuleGuardRead = { safeKey: string } & ({ moduleGuard: string } | { error: Error })

export type UsePolicyGuardResult = { state?: PolicyGuardState; isLoading: boolean; error?: Error }

const NO_RPC_ERROR = new Error('No RPC is configured for this chain')

export type PolicyGuardTarget = { chainId: string; safeAddress: string }

/** Reads the open Safe by default; pass a target to read any other Safe */
export const usePolicyGuard = (target?: PolicyGuardTarget): UsePolicyGuardResult => {
  const currentSafe = useSafeInfo()
  const currentProvider = useWeb3ReadOnly()
  const targetQuery = useSafesGetSafeV1Query(target ?? skipToken, { pollingInterval: POLLING_INTERVAL })
  const targetProvider = useReadOnlyProvider(target?.chainId)
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

  const safeKey = `${safe.chainId}:${safeAddress}`

  // CGW Safe info has no module guard field yet, so it is read from the storage slot
  const [read, , loading] = useAsync<ModuleGuardRead>(
    () => {
      if (!shouldRead || !web3ReadOnly) return
      return readModuleGuard(web3ReadOnly, safeAddress).then(
        (moduleGuard) => ({ safeKey, moduleGuard }),
        (error) => ({ safeKey, error: asError(error) }),
      )
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- txHistoryTag changes after each executed tx
    [shouldRead, web3ReadOnly, safeAddress, safeKey, safe.txHistoryTag],
    false,
  )

  // Data is kept across re-reads of the same Safe; a read for another Safe is ignored
  const currentRead = read?.safeKey === safeKey ? read : undefined
  const moduleGuard = currentRead && 'moduleGuard' in currentRead ? currentRead.moduleGuard : undefined
  const readError = currentRead && 'error' in currentRead ? currentRead.error : undefined
  const safeError = target && !safeLoaded && !safeLoading ? targetError : undefined
  const error = safeError ?? (shouldRead && !hasRpc ? NO_RPC_ERROR : readError)

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

  return {
    state,
    isLoading: safeLoading || (shouldRead && hasRpc && (!web3ReadOnly || loading || !currentRead)),
    error,
  }
}
