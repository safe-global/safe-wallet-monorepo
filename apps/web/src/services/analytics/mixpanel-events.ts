export enum MixpanelEvent {
  SAFE_APP_LAUNCHED = 'Safe App Launched',
  SAFE_CREATED = 'Safe Created',
  SAFE_ACTIVATED = 'Safe Activated',
  WALLET_CONNECTED = 'Wallet Connected',
  POSITION_EXPANDED = 'Position Expanded',
  POSITIONS_VIEW_ALL_CLICKED = 'Positions View All Clicked',
  EMPTY_POSITIONS_EXPLORE_CLICKED = 'Empty Positions Explore Clicked',
  STAKE_VIEWED = 'Stake Viewed',
  EARN_VIEWED = 'Earn Viewed',
  WC_CONNECTED = 'WC Connected',
  CSV_TX_EXPORT_CLICKED = 'Export CSV Clicked',
  CSV_TX_EXPORT_SUBMITTED = 'CSV Exported',
  NATIVE_SWAP_VIEWED = 'Native Swap Viewed',
  SAFE_LABS_TERMS_ACCEPTED = 'Safe Labs Terms Accepted',
  SIDEBAR_CLICKED = 'Sidebar Clicked',
  EXPLORE_POSSIBLE_CLICKED = 'Explore Possible Clicked',
  TRANSACTION_STARTED = 'Transaction Started',
  TRANSACTION_RECIPIENT_DECODED = 'Transaction Recipient Decoded',
  TRANSACTION_CONTRACT_DECODED = 'Transaction Contract Decoded',
  TRANSACTION_THREAT_ANALYZED = 'Transaction Threat Analyzed',
  TRANSACTION_SIMULATED = 'Transaction Simulated',
}

export enum MixpanelUserProperty {
  WALLET_LABEL = 'Wallet Label',
  WALLET_ADDRESS = 'Wallet Address',
  SAFE_ADDRESS = 'Safe Address',
  SAFE_VERSION = 'Safe Version',
  NUM_SIGNERS = 'Number of Signers',
  THRESHOLD = 'Threshold',
  NETWORKS = 'Networks',
  TOTAL_TX_COUNT = 'Total Transaction Count',
  LAST_TX_AT = 'Last Transaction at',
  IS_OWNER = 'Is Owner',
}

export enum MixpanelEventParams {
  APP_VERSION = 'App Version',
  BLOCKCHAIN_NETWORK = 'Blockchain Network',
  DEVICE_TYPE = 'Device Type',
  SAFE_ADDRESS = 'Safe Address',
  EOA_WALLET_LABEL = 'EOA Wallet Label',
  EOA_WALLET_ADDRESS = 'EOA Wallet Address',
  EOA_WALLET_NETWORK = 'EOA Wallet Network',
  ENTRY_POINT = 'Entry Point',
  NUMBER_OF_OWNERS = 'Number of Owners',
  THRESHOLD = 'Threshold',
  DEPLOYMENT_TYPE = 'Deployment Type',
  PAYMENT_METHOD = 'Payment Method',
  SAFE_APP_NAME = 'Safe App Name',
  SAFE_APP_TAGS = 'Safe App Tags',
  LAUNCH_LOCATION = 'Launch Location',
  PROTOCOL_NAME = 'Protocol Name',
  LOCATION = 'Location',
  AMOUNT_USD = 'Amount USD',
  TOTAL_VALUE_OF_PORTFOLIO = 'Total Value of Portfolio',
  APP_URL = 'App URL',
  DATE_RANGE = 'Date Range',
  SIDEBAR_ELEMENT = 'Sidebar Element',
  RESULT = 'Result',
}

export enum SafeAppLaunchLocation {
  PREVIEW_DRAWER = 'Preview Drawer',
  SAFE_APPS_LIST = 'Safe Apps List',
}

export const ADDRESS_PROPERTIES = new Set([
  MixpanelEventParams.SAFE_ADDRESS,
  MixpanelEventParams.EOA_WALLET_ADDRESS,
  MixpanelUserProperty.SAFE_ADDRESS,
])
