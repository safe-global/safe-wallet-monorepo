import type { TypedData } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import useAsync, { type AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { useHasFeature } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useSigner } from '@/hooks/wallets/useWallet'
import { MODALS_EVENTS, trackEvent } from '@/services/analytics'
import type { SecurityResponse } from '@safe-global/utils/services/security/modules/types'
import type { SafeTransaction } from '@safe-global/safe-core-sdk-types'

import { useEffect, useMemo } from 'react'
import {
  BlockaidModule,
  type BlockaidModuleResponse,
} from '@safe-global/utils/services/security/modules/BlockaidModule'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { Errors, logError } from '@/services/exceptions'

const BlockaidModuleInstance = new BlockaidModule()

const DEFAULT_ERROR_MESSAGE = 'Unavailable'

export const useBlockaid = (
  data: SafeTransaction | TypedData | undefined,
  origin?: string,
): AsyncResult<SecurityResponse<BlockaidModuleResponse>> => {
  const { safe, safeAddress } = useSafeInfo()
  const signer = useSigner()
  const isFeatureEnabled = useHasFeature(FEATURES.RISK_MITIGATION)

  const [blockaidPayload, blockaidErrors, blockaidLoading] = useAsync<SecurityResponse<BlockaidModuleResponse>>(
    () => {
      if (!isFeatureEnabled || !data || !signer?.address) {
        return
      }

      return BlockaidModuleInstance.scanTransaction({
        chainId: Number(safe.chainId),
        data,
        safeAddress,
        walletAddress: signer.address,
        threshold: safe.threshold,
        origin,
      })
    },
    [safe.chainId, safe.threshold, safeAddress, data, signer?.address, isFeatureEnabled, origin],
    false,
  )

  const loading = blockaidLoading

  useEffect(() => {
    if (!loading && blockaidPayload) {
      trackEvent({ ...MODALS_EVENTS.BLOCKAID_RESULT, label: blockaidPayload.severity })
    }
  }, [loading, blockaidPayload])

  const errorMsg = useMemo(
    () => (blockaidErrors ? new Error(DEFAULT_ERROR_MESSAGE) : blockaidPayload?.payload?.error),

    [blockaidErrors, blockaidPayload],
  )

  useEffect(() => {
    logError(Errors._201, errorMsg)
  }, [errorMsg])

  return [blockaidPayload, errorMsg, loading]
}
