import { useSafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { sameAddress } from '@safe-global/utils/utils/addresses'

type PolicyGuardState = {
  /** The Safe's currently installed guard, or undefined if none. */
  currentGuard?: string
  /** True if the Safe's guard IS the expected SafePolicyGuard. */
  isSet: boolean
  /** True if a DIFFERENT (non-policy) guard is set — setGuard would overwrite it. */
  isUnknownGuard: boolean
  isLoading: boolean
}

/**
 * Resolves whether the expected `SafePolicyGuard` is already the Safe's guard.
 * Every guard-enforced policy builder needs this to decide whether the batch
 * must prepend a `setGuard` tx, and to warn on a foreign-guard collision.
 */
export const usePolicyGuard = (
  chainId: string,
  safeAddress: string,
  expectedGuard: string | undefined,
): PolicyGuardState => {
  const { data: safeInfo, isLoading } = useSafesGetSafeV1Query(
    { chainId, safeAddress },
    { skip: !chainId || !safeAddress },
  )

  const currentGuard = safeInfo?.guard?.value || undefined
  const isSet = !!currentGuard && !!expectedGuard && sameAddress(currentGuard, expectedGuard)
  const isUnknownGuard = !!currentGuard && !isSet

  return { currentGuard, isSet, isUnknownGuard, isLoading }
}
