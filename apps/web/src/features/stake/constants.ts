export const STAKE_TITLE = 'Stake'
export const STAKE_CONSENT_STORAGE_KEY = 'stakeDisclaimerAcceptedV1'
export const WIDGET_PRODUCTION_URL = 'https://safe.widget.kiln.fi/overview'
export const WIDGET_TESTNET_URL = 'https://safe.widget.testnet.kiln.fi/overview'

export const widgetAppData = {
  url: WIDGET_PRODUCTION_URL,
  name: STAKE_TITLE,
  chainIds: ['17000', '11155111', '1', '42161', '137', '56', '8453', '10'],
}

// TODO: move this to the config service
export const BEACON_CHAIN_EXPLORERS = {
  '1': 'https://beaconcha.in',
  '17000': 'https://holesky.beaconcha.in',
}
