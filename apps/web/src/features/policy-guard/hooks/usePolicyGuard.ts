import { useMemo } from 'react'
import { skipToken } from '@reduxjs/toolkit/query/react'
import { useSafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useChain } from '@/hooks/useChains'
import { createWeb3ReadOnly } from '@/hooks/wallets/web3'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3ReadOnly'
import { getPolicyGuardAddress } from '../services/policyEngineDeployments'
import { isSafeVersionSupported } from '../services/allowlistAvailability'
import { resolvePolicyGuardState } from '../services/resolvePolicyGuardState'
import { readModuleGuard } from '../services/readModuleGuard'
import type { PolicyGuardState } from '../types'

type ModuleGuardRead = { safeKey: string } & ({ moduleGuard: string } | { error: Error })

export type UsePolicyGuardResult = { state?: PolicyGuardState; isLoading: boolean; error?: Error }

export type PolicyGuardTarget = { chainId: string; safeAddress: string }

/** Reads the open Safe by default; pass a target to read any other Safe */
export const usePolicyGuard = (target?: PolicyGuardTarget): UsePolicyGuardResult => {
  const currentSafe = useSafeInfo()
  const currentProvider = useWeb3ReadOnly()
  const {
    currentData: targetSafe,
    isFetching: targetSafeLoading,
    isError: isTargetSafeError,
  } = useSafesGetSafeV1Query(target ?? skipToken)
  const targetChain = useChain(target?.chainId ?? '')
  const targetProvider = useMemo(() => (targetChain ? createWeb3ReadOnly(targetChain) : undefined), [targetChain])

  const { safe, safeAddress, safeLoaded, safeLoading } = target
    ? {
        safe: targetSafe ?? { chainId: target.chainId, version: undefined, guard: undefined, txHistoryTag: undefined },
        safeAddress: target.safeAddress,
        safeLoaded: !!targetSafe,
        safeLoading: targetSafeLoading,
      }
    : currentSafe
  const web3ReadOnly = target ? targetProvider : currentProvider
  const policyGuardAddress = getPolicyGuardAddress(safe.chainId)
  const isSupported = isSafeVersionSupported(safe.version)
  const shouldRead = safeLoaded && !!policyGuardAddress && isSupported

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- txHistoryTag changes after each executed tx, which is how a new module guard shows up
    [shouldRead, web3ReadOnly, safeAddress, safeKey, safe.txHistoryTag],
    false,
  )

  // Data is kept across re-reads of the same Safe; a read for another Safe is ignored
  const currentRead = read?.safeKey === safeKey ? read : undefined
  const moduleGuard = currentRead && 'moduleGuard' in currentRead ? currentRead.moduleGuard : undefined
  const readError = currentRead && 'error' in currentRead ? currentRead.error : undefined
  const error = target && isTargetSafeError && !targetSafeLoading ? new Error('Failed to load the Safe') : readError

  const state = useMemo((): PolicyGuardState | undefined => {
    if (!safeLoaded || !policyGuardAddress) return
    if (!isSupported) return { status: 'unsupported' }
    if (!moduleGuard) return
    return resolvePolicyGuardState({
      txGuard: safe.guard?.value ?? ZERO_ADDRESS,
      moduleGuard,
      policyGuardAddress,
    })
  }, [safeLoaded, policyGuardAddress, isSupported, moduleGuard, safe.guard])

  return {
    state,
    isLoading: safeLoading || (shouldRead && (!web3ReadOnly || loading || !currentRead)),
    error,
  }
}
