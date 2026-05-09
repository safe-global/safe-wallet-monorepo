import { useCallback, useState, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { selectAllChains } from '@/src/store/chains'
import { selectDelegates } from '@/src/store/delegatesSlice'
import { cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/delegates'
import { useNotificationCleanup } from '@/src/hooks/useNotificationCleanup'
import { type Address } from '@/src/types/address'
import {
  DelegateCleanupService,
  DelegateCleanupPhase,
  DelegateCleanupProgress,
  DelegateCleanupError,
  DelegateCleanupErrorType,
} from '@/src/services/delegate-cleanup'
import { StandardErrorResult, ErrorType } from '@/src/utils/errors'

// Re-export types for backward compatibility
export type { DelegateCleanupError, DelegateCleanupProgress } from '@/src/services/delegate-cleanup'
export { DelegateCleanupPhase, DelegateCleanupErrorType } from '@/src/services/delegate-cleanup'

// Helper function to map standard error types to cleanup error types
const mapErrorTypeToCleanupErrorType = (errorType?: ErrorType): DelegateCleanupErrorType => {
  switch (errorType) {
    case ErrorType.VALIDATION_ERROR:
      return DelegateCleanupErrorType.INVALID_PARAMETERS
    case ErrorType.CLEANUP_ERROR:
      return DelegateCleanupErrorType.ORCHESTRATION_FAILED
    case ErrorType.NETWORK_ERROR:
      return DelegateCleanupErrorType.BACKEND_REMOVAL_FAILED
    case ErrorType.SYSTEM_ERROR:
    default:
      return DelegateCleanupErrorType.ORCHESTRATION_FAILED
  }
}

interface UseDelegateCleanupProps {
  removeAllDelegatesForOwner: (
    ownerAddress: Address,
    ownerPrivateKey: string,
  ) => Promise<StandardErrorResult<{ processedCount: number }>>
  isLoading: boolean
  error: DelegateCleanupError | null
  progress: DelegateCleanupProgress
}

export const useDelegateCleanup = (): UseDelegateCleanupProps => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<DelegateCleanupError | null>(null)
  const [progress, setProgress] = useState<DelegateCleanupProgress>({
    phase: DelegateCleanupPhase.IDLE,
    message: 'Ready to clean up delegates',
  })
  const dispatch = useAppDispatch()

  const allChains = useAppSelector(selectAllChains)
  const allDelegates = useAppSelector(selectDelegates)

  const { cleanupNotificationsForDelegate } = useNotificationCleanup()

  const [deleteDelegate] = cgwApi.useDelegatesDeleteDelegateV2Mutation()

  const cleanupService = useMemo(() => {
    return new DelegateCleanupService({
      allChains,
      allDelegates,
      cleanupNotificationsForDelegate,
      deleteDelegate,
      dispatch,
      onProgress: (progress) => {
        setProgress(progress)
      },
    })
  }, [allChains, allDelegates, cleanupNotificationsForDelegate, deleteDelegate, dispatch])

  const removeAllDelegatesForOwner = useCallback(
    async (ownerAddress: Address, ownerPrivateKey: string) => {
      try {
        setIsLoading(true)
        setError(null)

        const result = await cleanupService.removeAllDelegatesForOwner(ownerAddress, ownerPrivateKey)

        if (!result.success) {
          const cleanupError: DelegateCleanupError = {
            type: mapErrorTypeToCleanupErrorType(result.error?.type),
            message: result.error?.message || 'Unknown error',
            details: result.error?.details,
          }
          setError(cleanupError)
        }

        return result
      } finally {
        setIsLoading(false)
      }
    },
    [cleanupService],
  )

  return {
    removeAllDelegatesForOwner,
    isLoading,
    error,
    progress,
  }
}

export default useDelegateCleanup
