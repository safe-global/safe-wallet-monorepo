export interface ScreenProtectionOptions {
  screenshot?: boolean
  record?: boolean
  appSwitcher?: boolean
}

/**
 * Custom hook to enable screen protection when the screen is focused
 * and disable it when the screen is unfocused.
 *
 * @param options - Configuration options for what to protect against
 */
export const useScreenProtection = (
  _options: ScreenProtectionOptions = {
    screenshot: true,
    record: true,
    appSwitcher: true,
  },
) => {
  // DO nothing in e2e
}
