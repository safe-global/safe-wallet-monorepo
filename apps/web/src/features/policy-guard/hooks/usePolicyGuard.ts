import { useMemo } from 'react'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useChain } from '@/hooks/useChains'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3ReadOnly'
import { useAppSelector } from '@/store'
import { selectRpc } from '@/store/settingsSlice'
import { getPolicyGuardAddress } from '../services/policyEngineDeployments'
import { isSafeEligibleForAllowlist } from '../services/allowlistAvailability'
import { resolvePolicyGuardState } from '../services/resolvePolicyGuardState'
import { readModuleGuard } from '../services/readModuleGuard'
import type { PolicyGuardState } from '../types'

type ModuleGuardRead = { safeKey: string } & ({ moduleGuard: string } | { error: Error })

export type UsePolicyGuardResult = { state?: PolicyGuardState; isLoading: boolean; error?: Error }

const NO_RPC_ERROR = new Error('No RPC is configured for this chain')

/** Reads the open Safe; wrap in a SafeScopeProvider to read another Safe */
export const usePolicyGuard = (): UsePolicyGuardResult => {
  const { safe, safeAddress, safeLoaded, safeLoading } = useSafeInfo()
  const web3ReadOnly = useWeb3ReadOnly()
  const chain = useChain(safe.chainId)
  const customRpc = useAppSelector(selectRpc)
  const policyGuardAddress = getPolicyGuardAddress(safe.chainId)
  const eligibility = isSafeEligibleForAllowlist(safe, chain)
  const isUnsupported = !eligibility.eligible && eligibility.reason === 'version-unsupported'
  const shouldRead = safeLoaded && eligibility.eligible
  const hasRpc = !!chain && (!!chain.rpcUri.value || !!customRpc?.[chain.chainId])

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
  const error = shouldRead && !hasRpc ? NO_RPC_ERROR : readError

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
