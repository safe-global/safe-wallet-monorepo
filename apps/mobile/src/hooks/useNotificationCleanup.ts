import { useCallback, useState } from 'react'
import { useAppSelector } from '@/src/store/hooks'
import { selectAllChains } from '@/src/store/chains'
import { selectAllSafes } from '@/src/store/safesSlice'
import { type Address } from '@/src/types/address'
import {
  classifyNotificationError,
  getAffectedSafes,
  hasOtherDelegates,
  type NotificationCleanupError,
} from '@/src/utils/notifications/cleanup'
import { cleanupSafeNotifications } from '@/src/services/notifications/operations'
import Logger from '@/src/utils/logger'

interface NotificationCleanupResult {
  success: boolean
  error?: NotificationCleanupError
}

interface UseNotificationCleanupProps {
  cleanupNotificationsForDelegate: (
    ownerAddress: Address,
    delegateAddress: Address,
  ) => Promise<NotificationCleanupResult>
  isLoading: boolean
  error: string | null
}

export const useNotificationCleanup = (): UseNotificationCleanupProps => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const allChains = useAppSelector(selectAllChains)
  const allSafes = useAppSelector(selectAllSafes)
  const safeSubscriptions = useAppSelector((state) => state.safeSubscriptions)
  const fullState = useAppSelector((state) => state)

  const cleanupNotificationsForDelegate = useCallback(
    async (ownerAddress: Address, delegateAddress: Address): Promise<NotificationCleanupResult> => {
      try {
        setIsLoading(true)
        setError(null)

        const affectedSafes = getAffectedSafes(ownerAddress, allSafes, allChains, safeSubscriptions)

        if (affectedSafes.length === 0) {
          Logger.info('No safes with notification subscriptions found for delegate cleanup')
          setIsLoading(false)
          return { success: true }
        }

        // Process each affected safe in parallel
        const cleanupPromises = affectedSafes.map(async (safe) => {
          try {
            // Check if there are other delegates for this safe (pure function)
            const hasOthers = hasOtherDelegates(safe.address as Address, delegateAddress, fullState)

            // Clean up notifications for this safe (atomic operation)
            await cleanupSafeNotifications(safe.address, safe.chainIds, delegateAddress, hasOthers)

            return { success: true }
          } catch (error) {
            Logger.error(`Failed to cleanup notifications for safe ${safe.address}`, error)
            throw error
          }
        })

        // Execute all cleanup operations
        await Promise.all(cleanupPromises)

        setIsLoading(false)
        return { success: true }
      } catch (error) {
        Logger.error('Notification cleanup failed', error)
        setIsLoading(false)

        const classifiedError = classifyNotificationError(error)

        if (classifiedError.type === 'safe') {
          Logger.info(`Safe error during notification cleanup: ${classifiedError.message}`, error)
          return { success: true } // Don't block deletion for safe errors
        } else {
          const errorMsg = classifiedError.message
          setError(errorMsg)
          return { success: false, error: classifiedError }
        }
      }
    },
    [allChains, allSafes, safeSubscriptions, fullState],
  )

  return {
    cleanupNotificationsForDelegate,
    isLoading,
    error,
  }
}

export default useNotificationCleanup
