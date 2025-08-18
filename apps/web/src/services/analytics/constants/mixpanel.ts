/**
 * Mixpanel event names in Title Case for clean UI presentation
 */
export const MixpanelEvents = {
  SAFE_CREATED: 'Safe Created',
  SAFE_ACTIVATED: 'Safe Activated',
  SAFE_OPENED: 'Safe Opened',
  WALLET_CONNECTED: 'Wallet Connected',
  WALLET_DISCONNECTED: 'Wallet Disconnected',
  TRANSACTION_CREATED: 'Transaction Created',
  TRANSACTION_EXECUTED: 'Transaction Executed',
  TRANSACTION_REJECTED: 'Transaction Rejected',
  SAFE_APP_LAUNCHED: 'Safe App Launched',
  SAFE_APP_TRANSACTION: 'Safe App Transaction',
  BATCH_TRANSACTION: 'Batch Transaction',
  OWNER_ADDED: 'Owner Added',
  OWNER_REMOVED: 'Owner Removed',
  THRESHOLD_CHANGED: 'Threshold Changed',
  MODULE_ENABLED: 'Module Enabled',
  MODULE_DISABLED: 'Module Disabled',
} as const

/**
 * Mixpanel property names are expected in Title Case
 */
export const MixpanelProperties = {
  // Safe properties
  CHAIN_ID: 'Chain ID',
  SAFE_ADDRESS: 'Safe Address',
  SAFE_VERSION: 'Safe Version',
  DEPLOYMENT_TYPE: 'Deployment Type',
  THRESHOLD: 'Threshold',
  NUM_OWNERS: 'Number of Owners',
  PAYMENT_METHOD: 'Payment Method',

  // Wallet properties
  WALLET_TYPE: 'Wallet Type',
  WALLET_ADDRESS: 'Wallet Address',

  // Transaction properties
  TRANSACTION_TYPE: 'Transaction Type',
  TRANSACTION_VALUE: 'Transaction Value',
  GAS_LIMIT: 'Gas Limit',
  GAS_PRICE: 'Gas Price',

  // Safe App properties
  SAFE_APP_NAME: 'Safe App Name',
  SAFE_APP_URL: 'Safe App URL',
  LAUNCH_LOCATION: 'Launch Location',

  // Timestamps
  CREATION_TIMESTAMP: 'Creation Timestamp',
  EXECUTION_TIMESTAMP: 'Execution Timestamp',

  // App metadata
  APP_VERSION: 'App Version',
  DEVICE_TYPE: 'Device Type',
  BROWSER: 'Browser',
  OS: 'Operating System',

  // User experience
  USER_EXPERIENCE_FLOW: 'User Experience Flow',
  CREATION_DURATION_MS: 'Creation Duration (ms)',
  EXECUTION_DURATION_MS: 'Execution Duration (ms)',

  // Network and costs
  NETWORK_NAME: 'Network Name',
  ESTIMATED_GAS_COST: 'Estimated Gas Cost',
  ACTUAL_GAS_COST: 'Actual Gas Cost',
  IS_COUNTERFACTUAL: 'Is Counterfactual',
} as const

/**
 * Mixpanel user properties for Safe-specific user profiling and cohort analysis
 */
export const MixpanelUserProperties = {
  // Global Safe properties (no chain suffix)
  SAFE_ADDRESS: 'Safe Address',
  SAFE_VERSION: 'Safe Version',
  BLOCKCHAIN_NETWORKS: 'Blockchain Networks',

  // Chain-specific base properties (use with createChainProperty helper)
  CREATED_AT: 'Created at',
  NUMBER_OF_SIGNERS: 'Number of Signers',
  THRESHOLD: 'Threshold',
  TOTAL_TRANSACTION_COUNT: 'Total Transaction Count',
} as const

/**
 * Helper function to create chain-specific user property names
 * @param baseProperty - Base property name from MixpanelUserProperties
 * @param chainName - Chain name (e.g., "Ethereum", "Polygon")
 * @returns Chain-specific property name (e.g., "Created at on Ethereum")
 */
export const createChainProperty = (baseProperty: string, chainName: string): string => {
  return `${baseProperty} on ${chainName}`
}

// Type helpers for TypeScript
export type MixpanelEvent = (typeof MixpanelEvents)[keyof typeof MixpanelEvents]
export type MixpanelProperty = (typeof MixpanelProperties)[keyof typeof MixpanelProperties]
export type MixpanelUserProperty = (typeof MixpanelUserProperties)[keyof typeof MixpanelUserProperties]
