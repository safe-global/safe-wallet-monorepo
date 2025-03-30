import dynamic from 'next/dynamic'
import ExternalStore from '@safe-global/utils/services/ExternalStore'

const WalletConnectUi = dynamic(() => import('./WalletConnectUi'))

export default WalletConnectUi

// Open/close WC popup externally
export const wcPopupStore = new ExternalStore<boolean>(false)

export function openWalletConnect() {
  wcPopupStore.setStore(true)
}
