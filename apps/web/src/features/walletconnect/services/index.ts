export { default as WalletConnectWallet } from './WalletConnectWallet'
export { default as walletConnectInstance } from './walletConnectInstance'
export { trackRequest } from './tracking'

// Utils - exported for internal feature use, isSafePassApp also exported from feature index
export {
  getEip155ChainId,
  getPeerName,
  stripEip155Prefix,
  splitError,
  isPairingUri,
  getSupportedChainIds,
  isBlockedBridge,
  isWarnedBridge,
  isSafePassApp,
} from './utils'
