import { createFeatureHandle } from '@/features/__core__/createFeatureHandle'
import type { WalletConnectImplementation } from './contract'

// Feature handle - uses semantic mapping (walletconnect → FEATURES.NATIVE_WALLETCONNECT)
export const WalletConnectFeature = createFeatureHandle<WalletConnectImplementation>('walletconnect')
