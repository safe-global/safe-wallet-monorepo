import chains from './chains'
import { HELP_CENTER_URL } from '@safe-global/utils/config/constants'

type Environment = 'development' | 'production' | 'test' | 'cypress'

export const APP_ENV = process.env.NODE_ENV as Environment
export const IS_PRODUCTION = process.env.NEXT_PUBLIC_IS_PRODUCTION === 'true'
export const IS_DEV = APP_ENV === 'development'
export const IS_TEST_E2E = APP_ENV === 'cypress'
export const COMMIT_HASH = process.env.NEXT_PUBLIC_COMMIT_HASH || ''

// default chain ID's as provided to the environment
export const DEFAULT_TESTNET_CHAIN_ID = +(process.env.NEXT_PUBLIC_DEFAULT_TESTNET_CHAIN_ID ?? chains.sep)
export const DEFAULT_MAINNET_CHAIN_ID = +(process.env.NEXT_PUBLIC_DEFAULT_MAINNET_CHAIN_ID ?? chains.eth)

// default chain ID used in the application
export const DEFAULT_CHAIN_ID = IS_PRODUCTION ? DEFAULT_MAINNET_CHAIN_ID : DEFAULT_TESTNET_CHAIN_ID

export const GATEWAY_URL_PRODUCTION =
  process.env.NEXT_PUBLIC_GATEWAY_URL_PRODUCTION || 'https://safe-client.safe.global'
export const GATEWAY_URL_STAGING = process.env.NEXT_PUBLIC_GATEWAY_URL_STAGING || 'https://safe-client.staging.5afe.dev'

// Status page
export const STATUS_PAGE_URL = process.env.NEXT_PUBLIC_SAFE_STATUS_PAGE_URL || 'https://status.safe.global'

// Magic numbers
export const POLLING_INTERVAL = 15_000
export const PORTFOLIO_CACHE_TIME_MS = 10_000
export const BASE_TX_GAS = 21_000
export const LS_NAMESPACE = 'SAFE_v2__'
export const DUST_THRESHOLD = 0.01

export const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || ''
export const BEAMER_ID = process.env.NEXT_PUBLIC_BEAMER_ID || ''
export const DATADOG_CLIENT_TOKEN = process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN || ''

// Datadog RUM
export const DATADOG_RUM_APPLICATION_ID = process.env.NEXT_PUBLIC_DATADOG_RUM_APPLICATION_ID || ''
export const DATADOG_RUM_CLIENT_TOKEN = process.env.NEXT_PUBLIC_DATADOG_RUM_CLIENT_TOKEN || ''
export const DATADOG_RUM_SITE = process.env.NEXT_PUBLIC_DATADOG_RUM_SITE || 'datadoghq.eu'
export const DATADOG_RUM_SERVICE = process.env.NEXT_PUBLIC_DATADOG_RUM_SERVICE || 'safe-wallet-web'
export const DATADOG_RUM_ENV = process.env.NEXT_PUBLIC_DATADOG_RUM_ENV || 'development'
const parsedSessionSampleRate = Number(process.env.NEXT_PUBLIC_DATADOG_RUM_SESSION_SAMPLE_RATE)
export const DATADOG_RUM_SESSION_SAMPLE_RATE =
  process.env.NEXT_PUBLIC_DATADOG_RUM_SESSION_SAMPLE_RATE !== undefined && !Number.isNaN(parsedSessionSampleRate)
    ? parsedSessionSampleRate
    : 10

const parsedTraceSampleRate = Number(process.env.NEXT_PUBLIC_DATADOG_RUM_TRACE_SAMPLE_RATE)
export const DATADOG_RUM_TRACE_SAMPLE_RATE =
  process.env.NEXT_PUBLIC_DATADOG_RUM_TRACE_SAMPLE_RATE !== undefined && !Number.isNaN(parsedTraceSampleRate)
    ? parsedTraceSampleRate
    : 20

const parsedLogsSampleRate = Number(process.env.NEXT_PUBLIC_DATADOG_LOGS_SAMPLE_RATE)
export const DATADOG_LOGS_SAMPLE_RATE =
  process.env.NEXT_PUBLIC_DATADOG_LOGS_SAMPLE_RATE !== undefined && !Number.isNaN(parsedLogsSampleRate)
    ? parsedLogsSampleRate
    : 100

const parsedSessionReplaySampleRate = Number(process.env.NEXT_PUBLIC_DATADOG_RUM_SESSION_REPLAY_SAMPLE_RATE)
export const DATADOG_RUM_SESSION_REPLAY_SAMPLE_RATE =
  process.env.NEXT_PUBLIC_DATADOG_RUM_SESSION_REPLAY_SAMPLE_RATE !== undefined &&
  !Number.isNaN(parsedSessionReplaySampleRate)
    ? parsedSessionReplaySampleRate
    : 0

export const DATADOG_FORCE_ENABLE = process.env.NEXT_PUBLIC_DATADOG_FORCE_ENABLE === 'true'
export const DATADOG_RUM_TRACING_ENABLED = process.env.NEXT_PUBLIC_DATADOG_RUM_TRACING_ENABLED === 'true'

const parseBoolean = (value: string | undefined, defaultValue: boolean): boolean => {
  if (value === undefined) return defaultValue
  return value === 'true'
}

export const DATADOG_RUM_TRACK_USER_INTERACTIONS = parseBoolean(
  process.env.NEXT_PUBLIC_DATADOG_RUM_TRACK_USER_INTERACTIONS,
  true,
)
export const DATADOG_RUM_TRACK_RESOURCES = parseBoolean(process.env.NEXT_PUBLIC_DATADOG_RUM_TRACK_RESOURCES, true)
export const DATADOG_RUM_TRACK_LONG_TASKS = parseBoolean(process.env.NEXT_PUBLIC_DATADOG_RUM_TRACK_LONG_TASKS, true)

type DatadogPrivacyLevel = 'mask' | 'mask-user-input' | 'allow'
export const DATADOG_RUM_DEFAULT_PRIVACY_LEVEL = (process.env.NEXT_PUBLIC_DATADOG_RUM_DEFAULT_PRIVACY_LEVEL ||
  'mask') as DatadogPrivacyLevel

// Wallets
export const WC_PROJECT_ID = process.env.NEXT_PUBLIC_WC_PROJECT_ID || ''

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

// Mixpanel
const PROD_MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_PROD_MIXPANEL_TOKEN || ''
const STAGING_MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_STAGING_MIXPANEL_TOKEN || ''
export const MIXPANEL_TOKEN = IS_PRODUCTION ? PROD_MIXPANEL_TOKEN : STAGING_MIXPANEL_TOKEN

// Safe Apps tags
export enum SafeAppsTag {
  NFT = 'nft',
  TX_BUILDER = 'transaction-builder',
  SAFE_GOVERNANCE_APP = 'safe-governance-app',
  RECOVERY_SYGNUM = 'recovery-sygnum',
  SWAP_FALLBACK = 'swap-fallback',
}

// Safe Apps names
export enum SafeAppsName {
  CSV = 'CSV Airdrop',
  TRANSACTION_BUILDER = 'Transaction Builder',
}

// Legal
export const IS_OFFICIAL_HOST = process.env.NEXT_PUBLIC_IS_OFFICIAL_HOST === 'true'
export const OFFICIAL_HOSTS = /app\.safe\.global|.+\.5afe\.dev|localhost:3000|localhost:4000|localhost:6006/
export const IPFS_HOSTS = /app\.safe\.eth\.limo|app\.5afedev\.eth\.limo/
export const BRAND_NAME = process.env.NEXT_PUBLIC_BRAND_NAME || (IS_OFFICIAL_HOST ? 'Safe{Wallet}' : 'Wallet fork')
export const BRAND_LOGO = process.env.NEXT_PUBLIC_BRAND_LOGO || ''

export const CHAINALYSIS_OFAC_CONTRACT = '0x40c57923924b5c5c5455c48d93317139addac8fb'

export const ECOSYSTEM_ID_ADDRESS =
  process.env.NEXT_PUBLIC_ECOSYSTEM_ID_ADDRESS || '0x0000000000000000000000000000000000000000'
export const MULTICHAIN_HELP_ARTICLE = `${HELP_CENTER_URL}/en/articles/222612-multi-chain-safe`

// Hypernative Campaign IDs
export const PROD_HYPERNATIVE_OUTREACH_ID = parseInt(process.env.NEXT_PUBLIC_PROD_HYPERNATIVE_OUTREACH_ID ?? `${3}`)
export const STAGING_HYPERNATIVE_OUTREACH_ID = parseInt(
  process.env.NEXT_PUBLIC_STAGING_HYPERNATIVE_OUTREACH_ID ?? `${11}`,
)
export const PROD_HYPERNATIVE_ALLOWLIST_OUTREACH_ID = parseInt(
  process.env.NEXT_PUBLIC_PROD_HYPERNATIVE_ALLOWLIST_OUTREACH_ID ?? `${7}`,
)
export const STAGING_HYPERNATIVE_ALLOWLIST_OUTREACH_ID = parseInt(
  process.env.NEXT_PUBLIC_STAGING_HYPERNATIVE_ALLOWLIST_OUTREACH_ID ?? `${15}`,
)
// Deployment specifics
export const IS_BEHIND_IAP = process.env.NEXT_PUBLIC_IS_BEHIND_IAP === 'true'
