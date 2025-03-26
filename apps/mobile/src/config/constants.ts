import Constants from 'expo-constants'
import { Platform } from 'react-native'

// export const isProduction = process.env.NODE_ENV === 'production'
// TODO: put it to get from process.env.NODE_ENV once we remove the mocks for the user account.
export const isProduction = process.env.EXPO_PUBLIC_APP_VARIANT === 'production'
export const isAndroid = Platform.OS === 'android'
export const isTestingEnv = process.env.NODE_ENV === 'test'
export const isStorybookEnv = Constants?.expoConfig?.extra?.storybookEnabled === 'true'
export const POLLING_INTERVAL = 15_000

export const COMING_SOON_MESSAGE = 'This feature is coming soon.'
export const COMING_SOON_TITLE = 'Coming soon'

export const GATEWAY_URL_PRODUCTION =
  process.env.EXPO_PUBLIC_GATEWAY_URL_PRODUCTION || 'https://safe-client.safe.global'
export const GATEWAY_URL_STAGING = process.env.EXPO_PUBLIC_GATEWAY_URL_STAGING || 'https://safe-client.staging.5afe.dev'
export const GATEWAY_URL = isProduction ? GATEWAY_URL_PRODUCTION : GATEWAY_URL_STAGING

/**
 * The version of the onboarding flow.
 * If we change it and need all users to see it again, we can bump the version here.
 */
export const ONBOARDING_VERSION = 'v1'
export const INFURA_TOKEN = process.env.EXPO_PUBLIC_INFURA_TOKEN || ''
