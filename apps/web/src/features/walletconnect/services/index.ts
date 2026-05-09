export { default as WalletConnectWallet } from './WalletConnectWallet'
export { default as walletConnectInstance } from './walletConnectInstance'
export { trackRequest } from './tracking'

// Utils - exported for internal feature use
export {
  getEip155ChainId,
  getPeerName,
  stripEip155Prefix,
  splitError,
  isPairingUri,
  getSupportedChainIds,
  isBlockedBridge,
  isWarnedBridge,
} from './utils'
