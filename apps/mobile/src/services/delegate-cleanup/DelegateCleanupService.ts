import { Address } from '@/src/types/address'
import { AppDispatch } from '@/src/store'
import { cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/delegates'
import { useNotificationCleanup } from '@/src/hooks/useNotificationCleanup'
import {
  cleanupDelegateNotifications,
  removeDelegatesFromBackend,
  cleanupDelegateKeychain,
} from '@/src/hooks/useDelegateCleanup/utils'
import Logger from '@/src/utils/logger'
import { StandardErrorResult, ErrorType, createErrorResult, createSuccessResult } from '@/src/utils/errors'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { DelegateInfo, removeDelegate } from '@/src/store/delegatesSlice'
import { Wallet } from 'ethers'

// Enhanced error types for better error handling
export enum DelegateCleanupErrorType {
  NOTIFICATION_CLEANUP_FAILED = 'NOTIFICATION_CLEANUP_FAILED',
  BACKEND_REMOVAL_FAILED = 'BACKEND_REMOVAL_FAILED',
  KEYCHAIN_CLEANUP_FAILED = 'KEYCHAIN_CLEANUP_FAILED',
  ORCHESTRATION_FAILED = 'ORCHESTRATION_FAILED',
  NO_DELEGATES_FOUND = 'NO_DELEGATES_FOUND',
  INVALID_PARAMETERS = 'INVALID_PARAMETERS',
}

export interface DelegateCleanupError {
  type: DelegateCleanupErrorType
  message: string
  details?: {
    failedDelegates?: Address[]
    phase?: string
  }
}

// Progress tracking types
export enum DelegateCleanupPhase {
  IDLE = 'IDLE',
  VALIDATING = 'VALIDATING',
  CLEANING_NOTIFICATIONS = 'CLEANING_NOTIFICATIONS',
  REMOVING_FROM_BACKEND = 'REMOVING_FROM_BACKEND',
  CLEANING_KEYCHAIN = 'CLEANING_KEYCHAIN',
  UPDATING_STORE = 'UPDATING_STORE',
  COMPLETED = 'COMPLETED',
}

export interface DelegateCleanupProgress {
  phase: DelegateCleanupPhase
  message: string
  completedDelegates?: number
  totalDelegates?: number
}

// Configuration interface for dependency injection
export interface DelegateCleanupConfig {
  allChains: Chain[]
  allDelegates: Record<Address, Record<string, DelegateInfo>>
  cleanupNotificationsForDelegate: ReturnType<typeof useNotificationCleanup>['cleanupNotificationsForDelegate']
  deleteDelegate: ReturnType<typeof cgwApi.useDelegatesDeleteDelegateV2Mutation>[0]
  dispatch: AppDispatch
  onProgress?: (progress: DelegateCleanupProgress) => void
}

export class DelegateCleanupService {
  private config: DelegateCleanupConfig

  constructor(config: DelegateCleanupConfig) {
    this.config = config
  }

  async removeAllDelegatesForOwner(
    ownerAddress: Address,
    ownerPrivateKey: string,
  ): Promise<StandardErrorResult<{ processedCount: number }>> {
    try {
      this.reportProgress(DelegateCleanupPhase.VALIDATING, 'Validating parameters and checking delegates...')

      // Validate parameters
      if (!ownerAddress || !ownerPrivateKey) {
        return createErrorResult(ErrorType.VALIDATION_ERROR, 'Owner address and private key are required', null, {
          ownerAddress,
        })
      }

      const delegates = this.config.allDelegates[ownerAddress]

      if (!delegates || Object.keys(delegates).length === 0) {
        Logger.info('No delegates found for owner', { ownerAddress })
        this.reportProgress(DelegateCleanupPhase.COMPLETED, 'No delegates to clean up')
        return createSuccessResult({ processedCount: 0 })
      }

      const delegateAddresses = Object.keys(delegates) as Address[]
      Logger.info('Starting delegate cleanup process', {
        ownerAddress,
        delegateCount: delegateAddresses.length,
        delegateAddresses,
      })

      // Create owner wallet for signing
      const ownerWallet = new Wallet(ownerPrivateKey)

      // PHASE 1: Clean up notifications for all delegates
      // This is critical and must succeed before we proceed
      this.reportProgress(
        DelegateCleanupPhase.CLEANING_NOTIFICATIONS,
        'Cleaning up notifications...',
        0,
        delegateAddresses.length,
      )
      Logger.info('Starting notification cleanup for delegates', { delegateAddresses })

      const notificationCleanupResult = await cleanupDelegateNotifications(
        ownerAddress,
        delegateAddresses,
        this.config.cleanupNotificationsForDelegate,
      )

      if (!notificationCleanupResult.success) {
        Logger.error('Notification cleanup failed, aborting delegate removal', notificationCleanupResult.error)

        const cleanupError: DelegateCleanupError = {
          type: DelegateCleanupErrorType.NOTIFICATION_CLEANUP_FAILED,
          message: notificationCleanupResult.error || 'Failed to cleanup notifications',
          details: {
            failedDelegates: notificationCleanupResult.failedDelegates,
            phase: 'notification',
          },
        }

        return createErrorResult(ErrorType.CLEANUP_ERROR, cleanupError.message, cleanupError, {
          ownerAddress,
          failedDelegates: cleanupError.details?.failedDelegates,
        })
      }

      // PHASE 2: Remove delegates from backend transaction service
      this.reportProgress(
        DelegateCleanupPhase.REMOVING_FROM_BACKEND,
        'Removing delegates from backend...',
        0,
        delegateAddresses.length,
      )
      Logger.info('Starting backend delegate removal', { delegateAddresses })

      const backendRemovalResult = await removeDelegatesFromBackend(
        ownerAddress,
        delegateAddresses,
        ownerWallet,
        this.config.allChains,
        this.config.deleteDelegate,
      )

      // PHASE 3: Clean up keychain (always attempt, even if backend removal failed)
      this.reportProgress(
        DelegateCleanupPhase.CLEANING_KEYCHAIN,
        'Cleaning up keychain...',
        0,
        delegateAddresses.length,
      )
      Logger.info('Starting keychain cleanup', { delegateAddresses })

      await cleanupDelegateKeychain(ownerAddress, delegateAddresses)

      // PHASE 4: Update Redux store (remove delegates that were successfully processed)
      this.reportProgress(
        DelegateCleanupPhase.UPDATING_STORE,
        'Updating application state...',
        0,
        delegateAddresses.length,
      )
      Logger.info('Updating Redux store', { delegateAddresses })

      delegateAddresses.forEach((delegateAddress) => {
        this.config.dispatch(removeDelegate({ ownerAddress, delegateAddress }))
      })

      // Check if any critical errors occurred
      if (!backendRemovalResult.success) {
        const cleanupError: DelegateCleanupError = {
          type: DelegateCleanupErrorType.BACKEND_REMOVAL_FAILED,
          message: backendRemovalResult.error || 'Failed to remove delegates from backend',
          details: {
            failedDelegates: backendRemovalResult.failedDelegates,
            phase: 'backend',
          },
        }

        return createErrorResult(ErrorType.CLEANUP_ERROR, cleanupError.message, cleanupError, {
          ownerAddress,
          failedDelegates: cleanupError.details?.failedDelegates,
        })
      }

      Logger.info('Delegate cleanup completed successfully', {
        ownerAddress,
        delegateCount: delegateAddresses.length,
      })

      this.reportProgress(
        DelegateCleanupPhase.COMPLETED,
        `Successfully cleaned up ${delegateAddresses.length} delegates`,
        delegateAddresses.length,
        delegateAddresses.length,
      )

      return createSuccessResult({ processedCount: delegateAddresses.length })
    } catch (error) {
      Logger.error('Unexpected error during delegate cleanup', error)

      return createErrorResult(ErrorType.SYSTEM_ERROR, 'An unexpected error occurred during delegate cleanup', error, {
        ownerAddress,
      })
    }
  }

  private reportProgress(
    phase: DelegateCleanupPhase,
    message: string,
    completedDelegates?: number,
    totalDelegates?: number,
  ) {
    const progress: DelegateCleanupProgress = {
      phase,
      message,
      completedDelegates,
      totalDelegates,
    }

    if (this.config.onProgress) {
      this.config.onProgress(progress)
    }
  }
}
