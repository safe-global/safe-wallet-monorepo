import dynamic from '@/utils/dynamic'

// Not gated: the myAccounts feature is always enabled
const NonPinnedWarning = dynamic(() => import('../../components/NonPinnedWarning'))

export default NonPinnedWarning
