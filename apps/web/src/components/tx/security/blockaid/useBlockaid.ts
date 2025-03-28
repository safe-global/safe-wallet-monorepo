import useAsync, { type AsyncResult } from '@/hooks/useAsync'
import { useHasFeature } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useSigner } from '@/hooks/wallets/useWallet'
import { MODALS_EVENTS, trackEvent } from '@/services/analytics'
import type { SecurityResponse } from '@/services/security/modules/types'
import { FEATURES } from '@/utils/chains'
import type { SafeTransaction } from '@safe-global/safe-core-sdk-types'
import { useCallback, useEffect, useMemo } from 'react'

import type { EIP712TypedData } from '@safe-global/safe-gateway-typescript-sdk'
import { BlockaidModule, type BlockaidModuleResponse } from '@/services/security/modules/BlockaidModule'
import { Errors, logError } from '@/services/exceptions'

const BlockaidModuleInstance = new BlockaidModule()

const DEFAULT_ERROR_MESSAGE = 'Unavailable'

export const useBlockaid = (
  data: SafeTransaction | EIP712TypedData | undefined,
  origin?: string,
): AsyncResult<SecurityResponse<BlockaidModuleResponse>> => {
  const { safe, safeAddress } = useSafeInfo()
  const signer = useSigner()
  const isFeatureEnabled = useHasFeature(FEATURES.RISK_MITIGATION)
  const jsonData = data && JSON.stringify(data)

  const [blockaidPayload, blockaidErrors, blockaidLoading] = useAsync<SecurityResponse<BlockaidModuleResponse>>(
    () => {
      if (!isFeatureEnabled || !jsonData || !signer?.address) {
        return
      }

      let requestData
      try {
        requestData = JSON.parse(jsonData)
      } catch {}

      try {
        return BlockaidModuleInstance.scanTransaction({
          chainId: Number(safe.chainId),
          data: requestData,
          safeAddress,
          walletAddress: signer.address,
          threshold: safe.threshold,
          origin,
        })
      } catch (e) {
        logError(Errors._819, e)
        throw e
      }
    },
    [safe.chainId, safe.threshold, safeAddress, jsonData, signer?.address, isFeatureEnabled, origin],
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
  return [blockaidPayload, errorMsg, loading]
}

export const useBlockaidReportScan = (requestId?: string) => {
  return useCallback(
    (isAccepted: boolean) => {
      if (!requestId) return
      try {
        return BlockaidModuleInstance.reportScanStatus(requestId, isAccepted)
      } catch (e) {
        logError(Errors._820, e)
      }
    },
    [requestId],
  )
}
