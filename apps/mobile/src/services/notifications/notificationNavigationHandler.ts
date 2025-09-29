import { router } from 'expo-router'
import { getStore } from '@/src/store/utils/singletonStore'
import { setActiveSafe } from '@/src/store/activeSafeSlice'
import { selectAllSafes } from '@/src/store/safesSlice'
import { NotificationType } from '@safe-global/store/gateway/AUTO_GENERATED/notifications'
import { FirebaseMessagingTypes } from '@react-native-firebase/messaging'
import { Address } from '@/src/types/address'
import Logger from '@/src/utils/logger'

// Helper function to wait for router to be ready
const waitForRouter = async (maxAttempts = 50, delayMs = 100): Promise<boolean> => {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      // Test if router is ready by checking if we can access navigation state
      if (router.canGoBack !== undefined) {
        // Additional check to ensure router is truly ready
        await new Promise((resolve) => setTimeout(resolve, 50))
        return true
      }
    } catch (_error) {
      // Router not ready yet
      Logger.info(`Router not ready, attempt ${i + 1}/${maxAttempts}`)
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs))
  }
  Logger.error('Router failed to become ready within timeout')
  return false
}

export interface NotificationNavigationData {
  type: NotificationType
  chainId: string
  address: string
  safeTxHash?: string
  _txHash?: string
  value?: string
  failed?: string
}

export const NotificationNavigationHandler = {
  async handleNotificationPress(data: FirebaseMessagingTypes.RemoteMessage['data']): Promise<void> {
    Logger.info('NotificationNavigationHandler: handleNotificationPress called with data:', data)

    if (!data) {
      Logger.warn('NotificationNavigationHandler: No data provided')
      return
    }

    try {
      // Wait for router to be ready before attempting navigation
      Logger.info('NotificationNavigationHandler: Waiting for router to be ready...')
      const isRouterReady = await waitForRouter()

      if (!isRouterReady) {
        Logger.error('NotificationNavigationHandler: Router not ready after waiting, aborting navigation')
        return
      }

      Logger.info('NotificationNavigationHandler: Router is ready, proceeding with navigation')

      const notificationData = data as unknown as NotificationNavigationData
      const { type, chainId, address, safeTxHash } = notificationData

      Logger.info('NotificationNavigationHandler: Parsed notification data:', { type, chainId, address, safeTxHash })

      if (!type || !chainId || !address) {
        Logger.warn('NotificationNavigationHandler: Missing required notification data', { type, chainId, address })
        return
      }

      // Switch to the correct safe and chain
      await this.switchToSafe(address as Address, chainId)

      // Navigate based on notification type
      switch (type) {
        case 'INCOMING_ETHER':
        case 'INCOMING_TOKEN':
        case 'EXECUTED_MULTISIG_TRANSACTION':
          Logger.info('NotificationNavigationHandler: Navigating to transaction history')
          await this.navigateToTransactionHistory()
          break
        case 'CONFIRMATION_REQUEST':
          Logger.info('NotificationNavigationHandler: Navigating to confirm transaction')
          await this.navigateToConfirmTransaction(safeTxHash)
          break
        default:
          Logger.warn('NotificationNavigationHandler: Unknown notification type', { type })
          // Fallback to home screen with correct safe
          await this.safeNavigate('/')
          break
      }
    } catch (error) {
      Logger.error('NotificationNavigationHandler: Error handling notification press', error)
      // Fallback to home screen
      await this.safeNavigate('/')
    }
  },

  async switchToSafe(address: Address, chainId: string): Promise<void> {
    const currentState = getStore().getState()
    const allSafes = selectAllSafes(currentState)

    // Check if the safe exists in the user's wallet
    const safeExists = allSafes[address] && allSafes[address][chainId]

    if (!safeExists) {
      Logger.warn('NotificationNavigationHandler: Safe not found in user wallet', { address, chainId })
      throw new Error('Safe not found in user wallet')
    }

    // This is a bit of a hack, but for now we need to make it.
    // if the user is in a different safe and he is in the confirm tx screen
    // if we just switch the safe and try to push the new confirm tx screen from the notification
    // the app is going to crash (because we have a tx for a safe that is not the active safe)
    // so we need to dismiss all the screens and then switch the safe
    await this.safeDismissAll()

    // Switch to the safe
    getStore().dispatch(
      setActiveSafe({
        address,
        chainId,
      }),
    )

    Logger.info('NotificationNavigationHandler: Switched to safe', { address, chainId })
  },

  /**
   * Safe navigation wrapper that handles router readiness
   */
  async safeNavigate(path: string | { pathname: string; params?: Record<string, string> }): Promise<void> {
    try {
      const isRouterReady = await waitForRouter()
      if (!isRouterReady) {
        Logger.error('NotificationNavigationHandler: Router not ready for navigation')
        return
      }

      if (typeof path === 'string') {
        router.push(path as never)
      } else {
        router.push(path as never)
      }
    } catch (error) {
      Logger.error('NotificationNavigationHandler: Error during safe navigation', error)
    }
  },

  async safeDismissAll(): Promise<void> {
    const isRouterReady = await waitForRouter()
    if (isRouterReady && router.canGoBack()) {
      router.dismissAll()
    }
  },

  async navigateToTransactionHistory(): Promise<void> {
    await this.safeNavigate({
      pathname: '/transactions',
      params: { fromNotification: Date.now().toString() },
    })
  },

  async navigateToConfirmTransaction(safeTxHash?: string): Promise<void> {
    if (safeTxHash) {
      await this.safeNavigate({
        pathname: '/confirm-transaction',
        params: { txId: safeTxHash },
      })
    } else {
      await this.safeNavigate('/pending-transactions')
    }
  },
}
