import { useAppSelector } from '@/src/store/hooks'
import { selectTotalSafeCount } from '@/src/store/safesSlice'
import {
  createMyAccountsScreenViewEvent,
  createMyAccountsEditModeEvent,
  createSafeReorderEvent,
} from '@/src/services/analytics/events/overview'
import { trackEvent } from '@/src/services/analytics/firebaseAnalytics'

/**
 * Hook to track MyAccounts analytics events
 */
export const useMyAccountsAnalytics = () => {
  const totalSafeCount = useAppSelector(selectTotalSafeCount)

  /**
   * Track My Accounts screen view
   */
  const trackScreenView = async () => {
    try {
      const event = createMyAccountsScreenViewEvent(totalSafeCount)
      await trackEvent(event)
    } catch (error) {
      console.error('Error tracking My accounts screen view:', error)
    }
  }

  /**
   * Track entering or exiting edit mode
   * @param isEnteringEditMode - true if entering edit mode, false if exiting
   */
  const trackEditModeChange = async (isEnteringEditMode: boolean) => {
    try {
      const event = createMyAccountsEditModeEvent(isEnteringEditMode, totalSafeCount)
      await trackEvent(event)
    } catch (error) {
      console.error('Error tracking My accounts edit mode change:', error)
    }
  }

  /**
   * Track reorder event
   */
  const trackReorder = async () => {
    try {
      const event = createSafeReorderEvent(totalSafeCount)
      await trackEvent(event)
    } catch (error) {
      console.error('Error tracking safe reorder event:', error)
    }
  }

  return { trackScreenView, trackEditModeChange, trackReorder }
}
