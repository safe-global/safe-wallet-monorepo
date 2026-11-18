import { wcPopupStore } from '../store/wcPopupStore'
import { wcChainSwitchStore } from '../../store/wcChainSwitchSlice'

/** WalletConnect services for code outside the feature; the WalletKit instance loads on first use. */
export const walletConnectServices = {
  wcPopupStore,
  wcChainSwitchStore,
  updateSessions: async (chainId: string, safeAddress: string): Promise<void> => {
    const { default: walletConnectInstance } = await import('../../services/walletConnectInstance')
    await walletConnectInstance.updateSessions(chainId, safeAddress)
  },
}
