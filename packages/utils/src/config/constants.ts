export const LATEST_SAFE_VERSION =
  process.env.NEXT_PUBLIC_SAFE_VERSION || process.env.EXPO_PUBLIC_SAFE_VERSION || '1.4.1'

// Risk mitigation (Blockaid)
export const BLOCKAID_API =
  process.env.NEXT_PUBLIC_BLOCKAID_API || process.env.EXPO_PUBLIC_BLOCKAID_API || 'https://client.blockaid.io'
export const BLOCKAID_CLIENT_ID =
  process.env.NEXT_PUBLIC_BLOCKAID_CLIENT_ID || process.env.EXPO_PUBLIC_BLOCKAID_CLIENT_ID || ''
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
// Social
export const DISCORD_URL = 'https://chat.safe.global'
export const TWITTER_URL = 'https://twitter.com/safe'
