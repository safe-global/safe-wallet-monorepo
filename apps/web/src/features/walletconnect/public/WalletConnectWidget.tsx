import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const WalletConnectWidget = gatedDynamic(FEATURES.NATIVE_WALLETCONNECT, () => import('../components/WalletConnectUi'))

export default WalletConnectWidget
