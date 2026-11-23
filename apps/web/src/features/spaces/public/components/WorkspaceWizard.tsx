import dynamic from '@/utils/dynamic'

// Not gated: the spaces feature is always enabled
const WorkspaceWizard = dynamic(() => import('../../components/WorkspaceWizard'))

export default WorkspaceWizard
