import dynamic from '@/utils/dynamic'

// Not gated: the spaces feature is always enabled
const SpaceSettingsPage = dynamic(() => import('../components/SpaceSettings/Page'))

export default SpaceSettingsPage
