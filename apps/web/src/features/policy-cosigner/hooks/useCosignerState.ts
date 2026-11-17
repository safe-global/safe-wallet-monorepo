import { useEffect, useMemo, useState } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import type { SafeTransaction } from '@safe-global/types-kit'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { useGetCosignaturesQuery } from '@safe-global/store/cosigner/cosignerApi'
import { evaluateCosignatures } from '@safe-global/utils/features/policy-cosigner/cosignature'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3ReadOnly'
import { Errors, logError } from '@/services/exceptions'
import type { CosignerState } from '../types'
import { useCosignerServiceUrl } from './useCosignerServiceUrl'
import {
  getCosignerRequirement,
  getCosignerState,
  getSafeTxHash,
  getStaticCosignerState,
  getUnavailableState,
  isCosignerApplicable,
  toEthCall,
} from '../services/cosignerState'

const POLLING_INTERVAL = 5_000

/**
 * The co-signer's view of `safeTx`, and the policy context to append to its execution once the
 * co-signer has signed. Polls the service while the decision is outstanding. A tx that isn't
 * proposed yet is unknown to the service, so it isn't asked.
 */
export const useCosignerState = (
  safeTx: SafeTransaction | undefined,
  { isProposed }: { isProposed: boolean },
): { state?: CosignerState; policyContext?: string } => {
  const { safe } = useSafeInfo()
  const web3ReadOnly = useWeb3ReadOnly()
  const guard = safe.guard?.value
  const safeAddress = safe.address.value
  const serviceUrl = useCosignerServiceUrl(safe.chainId)
  const applicable = isCosignerApplicable(serviceUrl, guard)

  const [requirement, requirementError] = useAsync(() => {
    if (!applicable || !guard || !web3ReadOnly || !safeTx) return
    return getCosignerRequirement(toEthCall(web3ReadOnly), guard, safeAddress, safeTx.data).catch((error) => {
      logError(Errors._655, error)
      throw error
    })
  }, [applicable, guard, web3ReadOnly, safeTx, safeAddress])

  const staticState = requirement && safeTx ? getStaticCosignerState(requirement, safeTx.data) : undefined
  const cosigner = requirement?.mode === 'single' && !staticState ? requirement.cosigner : undefined

  const safeTxHash = useMemo(
    () =>
      isProposed && cosigner && safeTx && safe.version
        ? getSafeTxHash(safeAddress, safeTx.data, safe.version, safe.chainId)
        : undefined,
    [isProposed, cosigner, safeTx, safe.version, safeAddress, safe.chainId],
  )

  const [pollingInterval, setPollingInterval] = useState(POLLING_INTERVAL)
  const { currentData, error: serviceError } = useGetCosignaturesQuery(
    serviceUrl && safeTxHash ? { serviceUrl, safeTxHash } : skipToken,
    {
      pollingInterval,
    },
  )
  const waiting = !!cosigner && ['notFound', 'pending'].includes(evaluateCosignatures(currentData, cosigner).status)

  useEffect(() => {
    setPollingInterval(waiting ? POLLING_INTERVAL : 0)
  }, [waiting])

  const [fetchedState, verifyError] = useAsync(() => {
    if (!cosigner || !safeTxHash || !web3ReadOnly || !currentData) return
    return getCosignerState(toEthCall(web3ReadOnly), cosigner, safeTxHash, currentData).catch((error) => {
      logError(Errors._656, error)
      throw error
    })
  }, [cosigner, safeTxHash, web3ReadOnly, currentData])

  const notProposedState: CosignerState | undefined =
    cosigner && !isProposed ? { status: 'notProposed', cosigner } : undefined
  const unavailableState = getUnavailableState({
    requirementError,
    serviceError: safeTxHash && !currentData ? serviceError : undefined,
    verifyError,
    cosigner,
  })
  const state = staticState ?? notProposedState ?? unavailableState ?? fetchedState
  return { state, policyContext: state?.status === 'ready' ? state.context : undefined }
}
