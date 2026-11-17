import dynamic from '@/utils/dynamic'

// Not gated: the spaces feature is always enabled
const SpacePlansPage = dynamic(() => import('../components/Plans/Page'))

export default SpacePlansPage
