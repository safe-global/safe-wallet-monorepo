import { skipToken } from '@reduxjs/toolkit/query'
import { useSafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { isSafeVersionSupported } from '@/features/policy-guard/services'
import { useGetModuleGuardQuery } from '@/features/policy-guard/store'
import { useAppSelector } from '@/store'
import { selectRpc } from '@/store/settingsSlice'

type PolicyGuardState = {
  /** The Safe's currently installed guard, or undefined if none. */
  currentGuard?: string
  /** The Safe's currently installed module guard, or undefined if none. */
  currentModuleGuard?: string
  /** True if the expected SafePolicyGuard is in either slot, so a change must be requested. */
  isSet: boolean
  /** True if a DIFFERENT (non-policy) guard is in either slot and the setup batch would overwrite it. */
  isUnknownGuard: boolean
  /** The Safe predates v1.5.0, which added the module guard slot the policy guard needs. */
  isUnsupportedVersion: boolean
  isLoading: boolean
  error?: Error
}

const orUndefined = (guard?: string | null): string | undefined =>
  guard && !sameAddress(guard, ZERO_ADDRESS) ? guard : undefined

/**
 * Resolves whether the expected `SafePolicyGuard` is already installed on the Safe.
 * Every guard-enforced policy builder needs this to decide whether the batch must install
 * the guard in both slots, and to warn on a foreign-guard collision.
 */
export const usePolicyGuard = (
  chainId: string,
  safeAddress: string,
  expectedGuard: string | undefined,
): PolicyGuardState => {
  const { data: safeInfo, isLoading: isSafeLoading } = useSafesGetSafeV1Query(
    { chainId, safeAddress },
    { skip: !chainId || !safeAddress },
  )

  const isUnsupportedVersion = !!safeInfo && !isSafeVersionSupported(safeInfo.version)

  // CGW Safe info has no module guard field yet, so it is read from the storage slot
  const customRpc = useAppSelector(selectRpc)[chainId]
  const moduleGuardQuery = useGetModuleGuardQuery(
    safeInfo && !isUnsupportedVersion
      ? { chainId, safeAddress, txHistoryTag: safeInfo.txHistoryTag ?? '', customRpc }
      : skipToken,
  )
  const moduleGuardError = moduleGuardQuery.currentData ? undefined : (moduleGuardQuery.error as Error | undefined)

  const currentGuard = orUndefined(safeInfo?.guard?.value)
  const currentModuleGuard = orUndefined(moduleGuardQuery.currentData)
  const guards = [currentGuard, currentModuleGuard]

  const isSet = !!expectedGuard && guards.some((guard) => !!guard && sameAddress(guard, expectedGuard))
  const isUnknownGuard = !isSet && guards.some((guard) => !!guard && !sameAddress(guard, expectedGuard ?? ''))

  const isModuleGuardLoading = !isUnsupportedVersion && !!safeInfo && !moduleGuardQuery.currentData && !moduleGuardError

  return {
    currentGuard,
    currentModuleGuard,
    isSet,
    isUnknownGuard,
    isUnsupportedVersion,
    isLoading: isSafeLoading || isModuleGuardLoading,
    error: moduleGuardError,
  }
}
