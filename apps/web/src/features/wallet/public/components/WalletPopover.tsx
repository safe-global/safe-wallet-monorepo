import dynamic from '@/utils/dynamic'

// Not gated: the wallet feature is always enabled
const WalletPopover = dynamic(() => import('../../components/WalletPopover'))

export default WalletPopover
