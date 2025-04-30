import chains from './chains'
import { HELP_CENTER_URL } from '@safe-global/utils/config/constants'

export const IS_PRODUCTION = process.env.NEXT_PUBLIC_IS_PRODUCTION === 'true'
export const IS_DEV = process.env.NODE_ENV === 'development'

// default chain ID's as provided to the environment
export const DEFAULT_TESTNET_CHAIN_ID = +(process.env.NEXT_PUBLIC_DEFAULT_TESTNET_CHAIN_ID ?? chains.sep)
export const DEFAULT_MAINNET_CHAIN_ID = +(process.env.NEXT_PUBLIC_DEFAULT_MAINNET_CHAIN_ID ?? chains.eth)

// default chain ID used in the application
export const DEFAULT_CHAIN_ID = IS_PRODUCTION ? DEFAULT_MAINNET_CHAIN_ID : DEFAULT_TESTNET_CHAIN_ID

export const GATEWAY_URL_PRODUCTION =
  process.env.NEXT_PUBLIC_GATEWAY_URL_PRODUCTION || 'https://safe-client.safe.global'
export const GATEWAY_URL_STAGING = process.env.NEXT_PUBLIC_GATEWAY_URL_STAGING || 'https://safe-client.staging.5afe.dev'

// Magic numbers
export const POLLING_INTERVAL = 15_000
export const BASE_TX_GAS = 21_000
export const LS_NAMESPACE = 'SAFE_v2__'

export const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || ''
export const BEAMER_ID = process.env.NEXT_PUBLIC_BEAMER_ID || ''
export const DATADOG_CLIENT_TOKEN = process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN || ''

// Wallets
export const WC_PROJECT_ID = process.env.NEXT_PUBLIC_WC_PROJECT_ID || ''
export const TREZOR_APP_URL = 'app.safe.global'
export const TREZOR_EMAIL = 'support@safe.global'

// Safe Token
export const SAFE_TOKEN_ADDRESSES: { [chainId: string]: string } = {
  [chains.eth]: '0x5aFE3855358E112B5647B952709E6165e1c1eEEe',
  [chains.sep]: '0xd16d9C09d13E9Cf77615771eADC5d51a1Ae92a26',
}

export const SAFE_LOCKING_ADDRESS: { [chainId: string]: string } = {
  [chains.eth]: '0x0a7CB434f96f65972D46A5c1A64a9654dC9959b2',
  [chains.sep]: '0xb161ccb96b9b817F9bDf0048F212725128779DE9',
}

export const SAFE_APPS_THIRD_PARTY_COOKIES_CHECK_URL = 'https://third-party-cookies-check.gnosis-safe.com'
export const SAFE_APPS_DEMO_SAFE_MAINNET = 'eth:0xfF501B324DC6d78dC9F983f140B9211c3EdB4dc7'
export const SAFE_APPS_SDK_DOCS_URL =
  'https://help.safe.global/en/articles/145503-how-to-create-a-safe-app-with-safe-apps-sdk-and-list-it'

// Google Analytics
export const PROD_GA_TRACKING_ID = process.env.NEXT_PUBLIC_PROD_GA_TRACKING_ID || ''
export const TEST_GA_TRACKING_ID = process.env.NEXT_PUBLIC_TEST_GA_TRACKING_ID || ''
export const SAFE_APPS_GA_TRACKING_ID = process.env.NEXT_PUBLIC_SAFE_APPS_GA_TRACKING_ID || ''
export const GA_TRACKING_ID = IS_PRODUCTION ? PROD_GA_TRACKING_ID : TEST_GA_TRACKING_ID

// Safe Apps tags
export enum SafeAppsTag {
  NFT = 'nft',
  TX_BUILDER = 'transaction-builder',
  SAFE_GOVERNANCE_APP = 'safe-governance-app',
  ONRAMP = 'onramp',
  RECOVERY_SYGNUM = 'recovery-sygnum',
  SWAP_FALLBACK = 'swap-fallback',
}

// Safe Apps names
export enum SafeAppsName {
  CSV = 'CSV Airdrop',
}

export const RECOVERY_FEEDBACK_FORM =
  'https://noteforms.com/forms/safe-feedback-form-hk16ds?notionforms=1&utm_source=notionforms'

// Legal
export const IS_OFFICIAL_HOST = process.env.NEXT_PUBLIC_IS_OFFICIAL_HOST === 'true'
export const OFFICIAL_HOSTS = /app\.safe\.global|.+\.5afe\.dev|localhost:3000/
export const IPFS_HOSTS = /\.ipfs\.dweb\.link|\.ipfs\.w3s\.link|\.ipfs\.inbrowser\.link/
export const BRAND_NAME = process.env.NEXT_PUBLIC_BRAND_NAME || (IS_OFFICIAL_HOST ? 'Safe{Wallet}' : 'Wallet fork')
export const BRAND_LOGO = process.env.NEXT_PUBLIC_BRAND_LOGO || ''

export const REDEFINE_ARTICLE = 'https://safe.mirror.xyz/rInLWZwD_sf7enjoFerj6FIzCYmVMGrrV8Nhg4THdwI'

export const CHAINALYSIS_OFAC_CONTRACT = '0x40c57923924b5c5c5455c48d93317139addac8fb'

export const SAFE_PASS_URL = 'community.safe.global'
export const ECOSYSTEM_ID_ADDRESS =
  process.env.NEXT_PUBLIC_ECOSYSTEM_ID_ADDRESS || '0x0000000000000000000000000000000000000000'
export const MULTICHAIN_HELP_ARTICLE = `${HELP_CENTER_URL}/en/articles/222612-multi-chain-safe`
