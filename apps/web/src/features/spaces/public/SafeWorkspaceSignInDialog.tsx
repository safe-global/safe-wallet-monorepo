import dynamic from '@/utils/dynamic'

// Not gated: the spaces feature is always enabled
const SafeWorkspaceSignInDialog = dynamic(() => import('../components/SafeWorkspaceSignInDialog'))

export default SafeWorkspaceSignInDialog
