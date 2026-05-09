export const NEWS_BANNER_STORAGE_KEY = 'dismissedNewsBanners'

// Enhanced dismissal state for banners that need to track additional context
export interface BannerDismissalState {
  dismissed: boolean
  lastEligibilityState?: boolean
  dismissedAt?: number
}

export type DismissalState = string[] | Record<string, BannerDismissalState>

// Utility functions for enhanced dismissal logic
export const isBannerDismissed = (
  bannerId: string,
  dismissalState: DismissalState,
  currentEligibilityState?: boolean,
): boolean => {
  // Handle legacy string array format
  if (Array.isArray(dismissalState)) {
    return dismissalState.includes(bannerId)
  }

  const bannerState = dismissalState[bannerId]
  if (!bannerState) return false

  // If banner was dismissed and eligibility hasn't changed, keep it dismissed
  if (bannerState.dismissed && bannerState.lastEligibilityState === currentEligibilityState) {
    return true
  }

  // If eligibility changed, banner can reappear
  return false
}

export const dismissBanner = (
  bannerId: string,
  dismissalState: DismissalState,
  eligibilityState?: boolean,
): DismissalState => {
  // Handle legacy string array format - convert to new format
  if (Array.isArray(dismissalState)) {
    const newState: Record<string, BannerDismissalState> = {}
    dismissalState.forEach((id) => {
      newState[id] = { dismissed: true }
    })
    newState[bannerId] = {
      dismissed: true,
      lastEligibilityState: eligibilityState,
      dismissedAt: Date.now(),
    }
    return newState
  }

  return {
    ...dismissalState,
    [bannerId]: {
      dismissed: true,
      lastEligibilityState: eligibilityState,
      dismissedAt: Date.now(),
    },
  }
}

export const getSlidePosition = (start: number, end: number, width: number | undefined, gap = 0, threshold = 0.1) => {
  if (!width) return start

  const delta = end - start
  if (delta === 0) return start

  const direction = Math.sign(delta) // +1 next slide, –1 previous slide
  const distance = Math.abs(delta) // pixels actually dragged
  const bannerGap = direction * gap // gap between banners

  // If we dragged far enough, jump one slide in the drag direction,
  // otherwise snap back to where we started.
  if (distance >= width * threshold) {
    const targetIndex = Math.abs(Math.round((start + direction * width) / width))
    return targetIndex * width + bannerGap
  }

  // Not enough distance: stay on the original slide
  return Math.round(start / width) * width
}
