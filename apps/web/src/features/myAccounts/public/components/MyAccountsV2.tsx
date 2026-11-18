import dynamic from '@/utils/dynamic'

// Not gated: the myAccounts feature is always enabled
const MyAccountsV2 = dynamic(() => import('../../components/MyAccountsV2/MyAccountsV2'))

export default MyAccountsV2
