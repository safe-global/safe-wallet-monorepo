import chains from './chains'

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
export const LATEST_SAFE_VERSION = process.env.NEXT_PUBLIC_SAFE_VERSION || '1.4.1'

// Access keys
export const INFURA_TOKEN = process.env.NEXT_PUBLIC_INFURA_TOKEN || ''
export const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || ''
export const BEAMER_ID = process.env.NEXT_PUBLIC_BEAMER_ID || ''

// Wallets
export const WC_PROJECT_ID = process.env.NEXT_PUBLIC_WC_PROJECT_ID || ''
export const TREZOR_APP_URL = 'app.safe.global'
export const TREZOR_EMAIL = 'support@safe.global'

// Cypress
export const CYPRESS_MNEMONIC = process.env.NEXT_PUBLIC_CYPRESS_MNEMONIC || ''

// Safe Token
export const SAFE_TOKEN_ADDRESSES: { [chainId: string]: string } = {
  [chains.eth]: '0x5aFE3855358E112B5647B952709E6165e1c1eEEe',
  [chains.sep]: '0xd16d9C09d13E9Cf77615771eADC5d51a1Ae92a26',
}

export const SAFE_LOCKING_ADDRESS: { [chainId: string]: string } = {
  [chains.eth]: '0x0a7CB434f96f65972D46A5c1A64a9654dC9959b2',
  [chains.sep]: '0xb161ccb96b9b817F9bDf0048F212725128779DE9',
}

// Safe Apps
export const SAFE_APPS_INFURA_TOKEN = process.env.NEXT_PUBLIC_SAFE_APPS_INFURA_TOKEN || INFURA_TOKEN
export const SAFE_APPS_THIRD_PARTY_COOKIES_CHECK_URL = 'https://third-party-cookies-check.gnosis-safe.com'
export const SAFE_APPS_DEMO_SAFE_MAINNET = 'eth:0xfF501B324DC6d78dC9F983f140B9211c3EdB4dc7'
export const SAFE_APPS_SDK_DOCS_URL =
  'https://help.safe.global/en/articles/145503-how-to-create-a-safe-app-with-safe-apps-sdk-and-list-it'

// Google Analytics
export const PROD_GA_TRACKING_ID = process.env.NEXT_PUBLIC_PROD_GA_TRACKING_ID || ''
export const TEST_GA_TRACKING_ID = process.env.NEXT_PUBLIC_TEST_GA_TRACKING_ID || ''
export const SAFE_APPS_GA_TRACKING_ID = process.env.NEXT_PUBLIC_SAFE_APPS_GA_TRACKING_ID || ''
export const GA_TRACKING_ID = IS_PRODUCTION ? PROD_GA_TRACKING_ID : TEST_GA_TRACKING_ID

// Tenderly - API docs: https://www.notion.so/Simulate-API-Documentation-6f7009fe6d1a48c999ffeb7941efc104
export const TENDERLY_SIMULATE_ENDPOINT_URL = process.env.NEXT_PUBLIC_TENDERLY_SIMULATE_ENDPOINT_URL || ''
export const TENDERLY_PROJECT_NAME = process.env.NEXT_PUBLIC_TENDERLY_PROJECT_NAME || ''
export const TENDERLY_ORG_NAME = process.env.NEXT_PUBLIC_TENDERLY_ORG_NAME || ''

// Safe Apps tags
export enum SafeAppsTag {
  NFT = 'nft',
  TX_BUILDER = 'transaction-builder',
  SAFE_GOVERNANCE_APP = 'safe-governance-app',
  ONRAMP = 'onramp',
  RECOVERY_SYGNUM = 'recovery-sygnum',
}

// Help Center
export const HELP_CENTER_URL = 'https://help.safe.global'
export const HelpCenterArticle = {
  ADDRESS_BOOK_DATA: `${HELP_CENTER_URL}/en/articles/40811-address-book-export-and-import`,
  ADVANCED_PARAMS: `${HELP_CENTER_URL}/en/articles/40837-advanced-transaction-parameters`,
  CANCELLING_TRANSACTIONS: `${HELP_CENTER_URL}/en/articles/40836-why-do-i-need-to-pay-for-cancelling-a-transaction`,
  COOKIES: `${HELP_CENTER_URL}/en/articles/40797-why-do-i-need-to-enable-third-party-cookies-for-safe-apps`,
  CONFLICTING_TRANSACTIONS: `${HELP_CENTER_URL}/en/articles/40839-why-are-transactions-with-the-same-nonce-conflicting-with-each-other`,
  FALLBACK_HANDLER: `${HELP_CENTER_URL}/en/articles/40838-what-is-a-fallback-handler-and-how-does-it-relate-to-safe`,
  MOBILE_SAFE: `${HELP_CENTER_URL}/en/articles/40801-connect-to-web-with-mobile-safe`,
  RECOVERY: `${HELP_CENTER_URL}/en/articles/110656-account-recovery-in-safe-wallet`,
  RELAYING: `${HELP_CENTER_URL}/en/articles/59203-what-is-gas-fee-sponsoring`,
  SAFE_SETUP: `${HELP_CENTER_URL}/en/articles/40835-what-safe-setup-should-i-use`,
  SIGNED_MESSAGES: `${HELP_CENTER_URL}/en/articles/40783-what-are-signed-messages`,
  SPAM_TOKENS: `${HELP_CENTER_URL}/en/articles/40784-default-token-list-local-hiding-of-spam-tokens`,
  SPENDING_LIMITS: `${HELP_CENTER_URL}/en/articles/40842-set-up-and-use-spending-limits`,
  TRANSACTION_GUARD: `${HELP_CENTER_URL}/en/articles/40809-what-is-a-transaction-guard`,
  UNEXPECTED_DELEGATE_CALL: `${HELP_CENTER_URL}/en/articles/40794-why-do-i-see-an-unexpected-delegate-call-warning-in-my-transaction`,
  PROPOSERS: `${HELP_CENTER_URL}/en/articles/235770-proposers`,
  PUSH_NOTIFICATIONS: `${HELP_CENTER_URL}/en/articles/99197-how-to-start-receiving-web-push-notifications-in-the-web-wallet`,
  SWAP_WIDGET_FEES: `${HELP_CENTER_URL}/en/articles/178530-how-does-the-widget-fee-work-for-native-swaps`,
  VERIFY_TX_DETAILS: `${HELP_CENTER_URL}/en/articles/276343-how-to-perform-basic-transactions-checks-on-safe-wallet`,
} as const
export const HelperCenterArticleTitles = {
  RECOVERY: 'Learn more about the Account recovery process',
}

export const RECOVERY_FEEDBACK_FORM =
  'https://noteforms.com/forms/safe-feedback-form-hk16ds?notionforms=1&utm_source=notionforms'

// Social
export const DISCORD_URL = 'https://chat.safe.global'
export const TWITTER_URL = 'https://twitter.com/safe'

// Legal
export const IS_OFFICIAL_HOST = process.env.NEXT_PUBLIC_IS_OFFICIAL_HOST === 'true'
export const OFFICIAL_HOSTS = /app\.safe\.global|.+\.5afe\.dev|localhost:3000/
export const IPFS_HOSTS = /\.ipfs\.dweb\.link|\.ipfs\.w3s\.link|\.ipfs\.inbrowser\.link/
export const BRAND_NAME = process.env.NEXT_PUBLIC_BRAND_NAME || (IS_OFFICIAL_HOST ? 'Safe{Wallet}' : 'Wallet fork')
export const BRAND_LOGO = process.env.NEXT_PUBLIC_BRAND_LOGO || ''

// Risk mitigation (Blockaid)
export const BLOCKAID_API = 'https://client.blockaid.io'
export const BLOCKAID_CLIENT_ID = process.env.NEXT_PUBLIC_BLOCKAID_CLIENT_ID
export const REDEFINE_ARTICLE = 'https://safe.mirror.xyz/rInLWZwD_sf7enjoFerj6FIzCYmVMGrrV8Nhg4THdwI'

export const CHAINALYSIS_OFAC_CONTRACT = '0x40c57923924b5c5c5455c48d93317139addac8fb'

export const SAFE_PASS_URL = 'community.safe.global'
export const ECOSYSTEM_ID_ADDRESS =
  process.env.NEXT_PUBLIC_ECOSYSTEM_ID_ADDRESS || '0x0000000000000000000000000000000000000000'
export const MULTICHAIN_HELP_ARTICLE = `${HELP_CENTER_URL}/en/articles/222612-multi-chain-safe`
