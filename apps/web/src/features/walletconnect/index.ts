import dynamic from 'next/dynamic'

export type { WalletConnectContextType, WcChainSwitchRequest, WcAutoApproveProps } from './types'
export { WCLoadingState } from './types'
export { useIsWalletConnectEnabled } from './hooks'
export { useWcUri, useWalletConnectSearchParamUri, WC_URI_SEARCH_PARAM } from './hooks'
export { wcPopupStore, openWalletConnect, wcChainSwitchStore } from './store'
export { walletConnectInstance, isSafePassApp } from './services'
export { WalletConnectContext, WalletConnectProvider } from './components/WalletConnectContext'
export {
  SAFE_COMPATIBLE_METHODS,
  SAFE_COMPATIBLE_EVENTS,
  SAFE_WALLET_METADATA,
  EIP155,
  BlockedBridges,
  WarnedBridges,
  WarnedBridgeNames,
} from './constants'

const WalletConnectWidget = dynamic(
  () => import('./components/WalletConnectUi').then((mod) => ({ default: mod.default })),
  { ssr: false },
)

export default WalletConnectWidget
