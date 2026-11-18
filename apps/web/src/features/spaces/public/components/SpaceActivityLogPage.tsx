import dynamic from '@/utils/dynamic'

// Not gated: the spaces feature is always enabled
const SpaceActivityLogPage = dynamic(() => import('../../components/SpaceActivityLog/Page'))

export default SpaceActivityLogPage
