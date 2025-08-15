// Re-export the new centralized Mixpanel constants
export { MixpanelEvents, MixpanelProperties } from './constants/mixpanel'

// Legacy exports for backward compatibility
export const MixPanelEvent = {
  SAFE_APP_LAUNCHED: 'Safe App Launched',
  SAFE_CREATED: 'Safe Created',
  SAFE_ACTIVATED: 'Safe Activated',
  WALLET_CONNECTED: 'Wallet Connected',
} as const

export enum SafeAppLaunchLocation {
  PREVIEW_DRAWER = 'Preview Drawer',
  SAFE_APPS_LIST = 'Safe Apps List',
}
