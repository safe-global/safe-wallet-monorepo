type Environment = 'development' | 'production' | 'test' | 'cypress'

export const APP_ENV = process.env.NODE_ENV as Environment
export const IS_PRODUCTION = process.env.NEXT_PUBLIC_IS_PRODUCTION === 'true'
export const IS_DEV = APP_ENV === 'development'
export const IS_TEST = APP_ENV === 'test' || APP_ENV === 'cypress'

export const BRAND_NAME = process.env.NEXT_PUBLIC_BRAND_NAME || (IS_PRODUCTION ? 'Safe{Wallet}' : 'Wallet fork')
export const APP_VERSION = '1.0.0'
export const COMMIT_HASH = process.env.NEXT_PUBLIC_COMMIT_HASH || ''

// Wallets
export const WC_PROJECT_ID = process.env.NEXT_PUBLIC_WC_PROJECT_ID || ''
export const TREZOR_APP_URL = 'app.safe.global'
export const TREZOR_EMAIL = 'support@safe.global'
