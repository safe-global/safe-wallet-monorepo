import dynamic from '@/utils/dynamic'

// Not gated: the spaces feature is always enabled
const SecurityHubPage = dynamic(() => import('../../components/SecurityHub/Page'))

export default SecurityHubPage
