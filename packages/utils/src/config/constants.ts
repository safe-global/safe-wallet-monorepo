export const LATEST_SAFE_VERSION =
  process.env.NEXT_PUBLIC_SAFE_VERSION || process.env.EXPO_PUBLIC_SAFE_VERSION || '1.4.1'

// Risk mitigation (Blockaid)
export const BLOCKAID_API =
  process.env.NEXT_PUBLIC_BLOCKAID_API || process.env.EXPO_PUBLIC_BLOCKAID_API || 'https://client.blockaid.io'
export const BLOCKAID_CLIENT_ID =
  process.env.NEXT_PUBLIC_BLOCKAID_CLIENT_ID || process.env.EXPO_PUBLIC_BLOCKAID_CLIENT_ID || ''
// Risk mitigation (Hypernative)
export const HYPERNATIVE_API_BASE_URL =
  process.env.NEXT_PUBLIC_HYPERNATIVE_API_BASE_URL ||
  process.env.EXPO_PUBLIC_HYPERNATIVE_API_BASE_URL ||
  'https://api.hypernative.xyz'
// Access keys
export const INFURA_TOKEN = process.env.NEXT_PUBLIC_INFURA_TOKEN || process.env.EXPO_PUBLIC_INFURA_TOKEN || ''
// Safe Apps
export const SAFE_APPS_INFURA_TOKEN =
  process.env.NEXT_PUBLIC_SAFE_APPS_INFURA_TOKEN || process.env.EXPO_PUBLIC_SAFE_APPS_INFURA_TOKEN || INFURA_TOKEN

// Tenderly - API docs: https://www.notion.so/Simulate-API-Documentation-6f7009fe6d1a48c999ffeb7941efc104
export const TENDERLY_SIMULATE_ENDPOINT_URL =
  process.env.NEXT_PUBLIC_TENDERLY_SIMULATE_ENDPOINT_URL || process.env.EXPO_PUBLIC_TENDERLY_SIMULATE_ENDPOINT_URL || ''
export const TENDERLY_PROJECT_NAME =
  process.env.NEXT_PUBLIC_TENDERLY_PROJECT_NAME || process.env.EXPO_PUBLIC_TENDERLY_PROJECT_NAME || ''
export const TENDERLY_ORG_NAME =
  process.env.NEXT_PUBLIC_TENDERLY_ORG_NAME || process.env.EXPO_PUBLIC_TENDERLY_ORG_NAME || ''

// Captcha — set to empty string to disable CAPTCHA entirely
const IS_PRODUCTION =
  process.env.NEXT_PUBLIC_IS_PRODUCTION === 'true' || process.env.EXPO_PUBLIC_IS_PRODUCTION === 'true'

const TURNSTILE_SITE_KEY_PRODUCTION =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY_PRODUCTION || process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY_PRODUCTION || ''

const TURNSTILE_SITE_KEY_STAGING =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY_STAGING || process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY_STAGING || ''

export const TURNSTILE_SITE_KEY = IS_PRODUCTION ? TURNSTILE_SITE_KEY_PRODUCTION : TURNSTILE_SITE_KEY_STAGING

// Help Center
export const HELP_CENTER_URL = 'https://help.safe.global'
export const HelpCenterArticle = {
  ADDRESS_BOOK_DATA: `${HELP_CENTER_URL}/articles/9590725697-address-book`,
  ADVANCED_PARAMS: `${HELP_CENTER_URL}/articles/1896549699-transaction-fees`,
  CANCELLING_TRANSACTIONS: `${HELP_CENTER_URL}/articles/4016097317-why-do-i-need-to-pay-for-cancelling-a-transaction`,
  COOKIES: `${HELP_CENTER_URL}/articles/2134118452-why-do-i-need-to-enable-third-party-cookies-for-safe-apps`,
  CONFLICTING_TRANSACTIONS: `${HELP_CENTER_URL}/articles/9901464751-why-are-transactions-with-the-same-nonce-conflicting-with-each-other`,
  FALLBACK_HANDLER: `${HELP_CENTER_URL}/articles/9256158266-what-is-a-fallback-handler-and-how-does-it-relate-to-safe`,
  RECOVERY: `${HELP_CENTER_URL}/articles/9622260218-account-recovery-with-saferecoveryhub`,
  RELAYING: `${HELP_CENTER_URL}/articles/9993850744-safewallet-gas-fees-faq`,
  SAFE_SETUP: `${HELP_CENTER_URL}/articles/1038062742-what-safe-setup-should-i-use`,
  SIGNED_MESSAGES: `${HELP_CENTER_URL}/articles/7507962149-what-are-signed-messages`,
  SPAM_TOKENS: `${HELP_CENTER_URL}/articles/8123132082-token-visibility-spam-protection-and-hiding-tokens`,
  SPENDING_LIMITS: `${HELP_CENTER_URL}/articles/3961440620-set-up-and-use-spending-limits`,
  TRANSACTION_GUARD: `${HELP_CENTER_URL}/articles/6757075087-what-is-a-transaction-guard`,
  UNEXPECTED_DELEGATE_CALL: `${HELP_CENTER_URL}/articles/4308960633-why-do-i-see-an-unexpected-delegate-call-warning-in-my-transaction`,
  PROPOSERS: `${HELP_CENTER_URL}/articles/1671337645-proposers`,
  PUSH_NOTIFICATIONS: `${HELP_CENTER_URL}/articles/9750082418-how-to-start-receiving-web-push-notifications-in-the-web-wallet`,
  SWAP_WIDGET_FEES: `${HELP_CENTER_URL}/articles/9969629388-how-does-the-widget-fee-work-for-native-swaps`,
  VERIFY_TX_DETAILS: `${HELP_CENTER_URL}/articles/2485383995-how-to-perform-basic-transactions-checks-on-safewallet`,
  BULK_IMPORT_OLD_DATA: `${HELP_CENTER_URL}/articles/6865463992-export-your-data-from-the-safewallet-mobile-app-and-import-into-the-new-safemobile-app-ios-only`,
  SAFE_SHIELD: `${HELP_CENTER_URL}/articles/6128275759-security-hub`,
  ADDRESS_POISONING: `${HELP_CENTER_URL}/articles/3861480988-what-is-address-poisoning-and-how-does-safewallet-battle-it`,
} as const
export const HelperCenterArticleTitles = {
  RECOVERY: 'Learn more about the Account recovery process',
}
// Social
export const DISCORD_URL = 'https://chat.safe.global'
export const TWITTER_URL = 'https://twitter.com/safe'
export const SAFE_TO_L2_MIGRATION_VERSION = '1.4.1'
