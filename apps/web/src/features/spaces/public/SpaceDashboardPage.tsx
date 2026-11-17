import dynamic from '@/utils/dynamic'

// Not gated: the spaces feature is always enabled
const SpaceDashboardPage = dynamic(() => import('../components/Dashboard/Page'))

export default SpaceDashboardPage
