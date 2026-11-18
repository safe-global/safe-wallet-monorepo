import dynamic from '@/utils/dynamic'

// Not gated: the myAccounts feature is always enabled
const AccountsNavigation = dynamic(() => import('../../components/AccountsNavigation'))

export default AccountsNavigation
