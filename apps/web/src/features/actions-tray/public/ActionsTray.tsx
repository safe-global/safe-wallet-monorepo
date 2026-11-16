import dynamic from '@/utils/dynamic'

// Not gated: the actions-tray feature is always enabled
const ActionsTray = dynamic(() => import('../components/ActionsTray/ActionsTray'))

export default ActionsTray
