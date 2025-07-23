export enum MixPanelEvent {
  SAFE_APP_LAUNCHED = 'Safe App Launched',
}

export enum MixPanelUserProperty {
  WALLET_LABEL = 'Wallet Label',
  WALLET_ADDRESS = 'Wallet Address',
  SAFE_ADDRESS = 'Safe Address',
  SAFE_VERSION = 'Safe Version',
  NUM_SIGNERS = 'Number of Signers',
  THRESHOLD = 'Threshold',
  NETWORKS = 'Networks',
  TOTAL_TX_COUNT = 'Total Transaction Count',
  LAST_TX_AT = 'Last Transaction at',
}

export enum MixPanelEventParams {
  APP_VERSION = 'App Version',
  BLOCKCHAIN_NETWORK = 'Blockchain Network',
  DEVICE_TYPE = 'Device Type',
  SAFE_ADDRESS = 'Safe Address',
  EOA_WALLET_LABEL = 'EOA Wallet Label',
  EOA_WALLET_ADDRESS = 'EOA Wallet Address',
  EOA_WALLET_NETWORK = 'EOA Wallet Network',
}

export enum SafeAppLaunchLocation {
  PREVIEW_DRAWER = 'Preview Drawer',
  SAFE_APPS_LIST = 'Safe Apps List',
}
