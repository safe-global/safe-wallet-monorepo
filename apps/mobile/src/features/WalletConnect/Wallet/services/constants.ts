import { EIP155 } from '@safe-global/utils/features/walletconnect/constants'

// Methods advertised in the session namespace. Intentionally excludes READ_ONLY_RPC_ALLOW_LIST:
// reads are proxied opportunistically, and a strict dApp that gates on the namespace can fall
// back to its own RPC for them (mirrors web's safe-wallet-provider).
export const WALLET_SUPPORTED_METHODS = [
  'eth_accounts',
  'eth_chainId',
  'net_version',
  'eth_sendTransaction',
  'wallet_sendCalls',
  'wallet_switchEthereumChain',
  'wallet_getCapabilities',
  'wallet_getCallsStatus',
  'wallet_showCallsStatus',
] as const

export type SupportedMethod = (typeof WALLET_SUPPORTED_METHODS)[number]

// Read-only methods proxied to the chain RPC (ethers JsonRpcProvider).
export const READ_ONLY_RPC_ALLOW_LIST = [
  'eth_blockNumber',
  'eth_call',
  'eth_estimateGas',
  'eth_gasPrice',
  'eth_getBalance',
  'eth_getBlockByHash',
  'eth_getBlockByNumber',
  'eth_getCode',
  'eth_getLogs',
  'eth_getStorageAt',
  'eth_getTransactionByHash',
  'eth_getTransactionCount',
  'eth_getTransactionReceipt',
  'eth_feeHistory',
  'eth_maxPriorityFeePerGas',
] as const

// Methods explicitly rejected with UNSUPPORTED_METHOD (no UI).
export const REJECTED_SIGNING_METHODS = [
  'personal_sign',
  'eth_sign',
  'eth_signTypedData',
  'eth_signTypedData_v3',
  'eth_signTypedData_v4',
  'safe_setSettings',
] as const

export const EVENTS_TO_EMIT = ['chainChanged', 'accountsChanged'] as const

// WalletConnect namespaces this wallet supports.
export const SUPPORTED_NAMESPACE = EIP155
