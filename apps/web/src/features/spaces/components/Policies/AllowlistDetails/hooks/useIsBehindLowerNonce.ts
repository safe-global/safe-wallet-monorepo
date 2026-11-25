import { skipToken } from '@reduxjs/toolkit/query'
import { useSafesGetNoncesV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { POLLING_INTERVAL } from '@/config/constants'
import type { PendingAllowlistPolicy } from '@safe-global/views/features/spaces/components/Policies/types'

/** Whether the Safe must first execute transactions with a lower nonce; only asked once `isExecutable`. */
export const useIsBehindLowerNonce = (
  { safe, nonce }: Pick<PendingAllowlistPolicy, 'safe' | 'nonce'>,
  isExecutable: boolean,
): boolean => {
  // Another signer can execute the transactions ahead of it from any tab.
  const { currentData } = useSafesGetNoncesV1Query(
    isExecutable ? { chainId: safe.chainId, safeAddress: safe.address } : skipToken,
    { pollingInterval: POLLING_INTERVAL, skipPollingIfUnfocused: true, refetchOnMountOrArgChange: true },
  )

  return currentData !== undefined && nonce > currentData.currentNonce
}
