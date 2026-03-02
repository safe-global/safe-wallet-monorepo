export const APP_UPDATE_EVENTS = {
  FORCED_UPDATE_SHOWN: 'forced_update_shown',
  FORCED_UPDATE_TAPPED: 'forced_update_tapped',
  SOFT_UPDATE_SHOWN: 'soft_update_shown',
  SOFT_UPDATE_TAPPED: 'soft_update_tapped',
  SOFT_UPDATE_DISMISSED: 'soft_update_dismissed',
} as const

export type AppUpdateEvent = (typeof APP_UPDATE_EVENTS)[keyof typeof APP_UPDATE_EVENTS]
