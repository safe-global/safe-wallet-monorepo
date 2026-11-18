import dynamic from '@/utils/dynamic'

// Not gated: the spaces feature is always enabled
const SpaceMembersPage = dynamic(() => import('../../components/Members/Page'))

export default SpaceMembersPage
