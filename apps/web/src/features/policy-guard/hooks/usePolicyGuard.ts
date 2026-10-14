import { useMemo } from 'react'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3ReadOnly'
import { getPolicyGuardAddress } from '../services/policyEngineDeployments'
import { isSafeVersionSupported } from '../services/allowlistAvailability'
import { resolvePolicyGuardState } from '../services/resolvePolicyGuardState'
import { readModuleGuard } from '../services/readModuleGuard'
import type { PolicyGuardState } from '../types'

type ModuleGuardRead = { safeKey: string } & ({ moduleGuard: string } | { error: Error })

export type UsePolicyGuardResult = { state?: PolicyGuardState; isLoading: boolean; error?: Error }

export const usePolicyGuard = (): UsePolicyGuardResult => {
  const { safe, safeAddress, safeLoaded, safeLoading } = useSafeInfo()
  const web3ReadOnly = useWeb3ReadOnly()
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
  const error = currentRead && 'error' in currentRead ? currentRead.error : undefined

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
