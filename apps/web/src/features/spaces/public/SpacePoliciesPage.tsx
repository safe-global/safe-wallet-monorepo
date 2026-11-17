import dynamic from '@/utils/dynamic'

// Not gated: the spaces feature is always enabled
const SpacePoliciesPage = dynamic(() => import('../components/Policies/Page'))

export default SpacePoliciesPage
