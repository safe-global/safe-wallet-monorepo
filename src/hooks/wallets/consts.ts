export const enum WALLET_KEYS {
  INJECTED = 'INJECTED',
  WALLETCONNECT_V2 = 'WALLETCONNECT_V2',
  COINBASE = 'COINBASE',
  PAIRING = 'PAIRING',
  LEDGER = 'LEDGER',
  TREZOR = 'TREZOR',
  KEYSTONE = 'KEYSTONE',
}

export const CGW_NAMES: { [key in WALLET_KEYS]: string | undefined } = {
  [WALLET_KEYS.INJECTED]: 'detectedwallet',
  [WALLET_KEYS.WALLETCONNECT_V2]: 'walletConnect_v2',
  [WALLET_KEYS.COINBASE]: 'coinbase',
  [WALLET_KEYS.PAIRING]: 'safeMobile',
  [WALLET_KEYS.LEDGER]: 'ledger',
  [WALLET_KEYS.TREZOR]: 'trezor',
  [WALLET_KEYS.KEYSTONE]: 'keystone',
}
