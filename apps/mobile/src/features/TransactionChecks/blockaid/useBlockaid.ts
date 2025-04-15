import type { TypedData } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { useHasFeature } from '@/src/hooks/useHasFeature'
import useSafeInfo from '@/src/hooks/useSafeInfo'
import type { SecurityResponse } from '@safe-global/utils/services/security/modules/types'
import type { SafeTransaction } from '@safe-global/safe-core-sdk-types'

import { useCallback, useState } from 'react'
import {
  BlockaidModule,
  type BlockaidModuleResponse,
} from '@safe-global/utils/services/security/modules/BlockaidModule'
import { FEATURES } from '@safe-global/utils/utils/chains'
import Logger from '@/src/utils/logger'
import { asError } from '@safe-global/utils/services/exceptions/utils'

const BlockaidModuleInstance = new BlockaidModule()

const DEFAULT_ERROR_MESSAGE = 'Unavailable'

export type BlockaidScanParams = {
  data: SafeTransaction | TypedData
  signer: string
  origin?: string
}

export type UseBlockaidReturn = {
  scanTransaction: (params: BlockaidScanParams) => Promise<void>
  blockaidPayload: SecurityResponse<BlockaidModuleResponse> | undefined
  error: Error | undefined
  loading: boolean
  resetBlockaid: () => void
}

export const useBlockaid = (): UseBlockaidReturn => {
  const { safe, safeAddress } = useSafeInfo()
  const isFeatureEnabled = useHasFeature(FEATURES.RISK_MITIGATION)

  const [blockaidPayload, setBlockaidPayload] = useState<SecurityResponse<BlockaidModuleResponse> | undefined>()
  const [error, setError] = useState<Error | undefined>()
  const [loading, setLoading] = useState<boolean>(false)

  const resetBlockaid = useCallback(() => {
    setBlockaidPayload(undefined)
    setError(undefined)
    setLoading(false)
  }, [])

  const scanTransaction = useCallback(
    async (params: BlockaidScanParams) => {
      if (!isFeatureEnabled || !safeAddress) {
        return
      }

      setLoading(true)
      setError(undefined)

      try {
        const result = await BlockaidModuleInstance.scanTransaction({
          chainId: Number(safe.chainId),
          data: params.data,
          safeAddress,
          walletAddress: params.signer,
          threshold: safe.threshold,
          origin: params.origin,
        })

        setBlockaidPayload(result)
      } catch (err) {
        Logger.error(asError(err).message)
        setError(new Error(DEFAULT_ERROR_MESSAGE))
      } finally {
        setLoading(false)
      }
    },
    [safe.chainId, safe.threshold, safeAddress, isFeatureEnabled],
  )

  return {
    scanTransaction,
    blockaidPayload,
    error,
    loading,
    resetBlockaid,
  }
}
