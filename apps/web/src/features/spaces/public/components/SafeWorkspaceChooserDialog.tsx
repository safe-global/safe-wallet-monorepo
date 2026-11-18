import dynamic from '@/utils/dynamic'

// Not gated: the spaces feature is always enabled
const SafeWorkspaceChooserDialog = dynamic(() => import('../../components/SafeWorkspaceChooserDialog'))

export default SafeWorkspaceChooserDialog
