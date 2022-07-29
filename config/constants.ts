export const STAGING_GATEWAY_URL = 'https://safe-client.staging.gnosisdev.com'
export const POLLING_INTERVAL = 15_000
export const IS_PRODUCTION = process.env.NEXT_PUBLIC_IS_PRODUCTION
export const LS_NAMESPACE = 'SAFE_v2__'
export const INFURA_TOKEN = process.env.NEXT_PUBLIC_INFURA_TOKEN || '0ebf4dd05d6740f482938b8a80860d13'
export const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || ''
export const WC_BRIDGE = process.env.NEXT_PUBLIC_WC_BRIDGE || 'https://safe-walletconnect.gnosis.io/'
export const FORTMATIC_KEY = process.env.NEXT_PUBLIC_FORTMATIC_KEY || 'pk_test_CAD437AA29BE0A40'
export const PORTIS_KEY = process.env.NEXT_PUBLIC_PORTIS_KEY || '852b763d-f28b-4463-80cb-846d7ec5806b'
export const TREZOR_APP_URL = 'gnosis-safe.io'
export const TREZOR_EMAIL = 'safe@gnosis.io'
export const LATEST_SAFE_VERSION = process.env.NEXT_PUBLIC_SAFE_VERSION || '1.3.0'
export const BEAMER_ID = process.env.NEXT_PUBLIC_BEAMER_ID
export const SAFE_REACT_URL = IS_PRODUCTION ? 'https://gnosis-safe.io/app' : 'https://safe-team.dev.gnosisdev.com/app'
export const BASE_TX_GAS = 21_000
export const SAFE_TOKEN_ADDRESSES: { [chainId: string]: string } = {
  '1': '0x5aFE3855358E112B5647B952709E6165e1c1eEEe',
  '4': '0xCFf1b0FdE85C102552D1D96084AF148f478F964A',
}
