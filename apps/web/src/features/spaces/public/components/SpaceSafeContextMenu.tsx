import dynamic from '@/utils/dynamic'

// Not gated: the spaces feature is always enabled
const SpaceSafeContextMenu = dynamic(() => import('../../components/SafeAccounts/SpaceSafeContextMenu'))

export default SpaceSafeContextMenu
