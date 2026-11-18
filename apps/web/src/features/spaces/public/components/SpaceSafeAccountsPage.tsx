import dynamic from '@/utils/dynamic'

// Not gated: the spaces feature is always enabled
const SpaceSafeAccountsPage = dynamic(() => import('../../components/SafeAccounts/Page'))

export default SpaceSafeAccountsPage
