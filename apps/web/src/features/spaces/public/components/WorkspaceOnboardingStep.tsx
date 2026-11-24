import dynamic from '@/utils/dynamic'

// Not gated: the spaces feature is always enabled
const WorkspaceOnboardingStep = dynamic(() => import('../../components/WorkspaceWizard/WorkspaceOnboardingStep'))

export default WorkspaceOnboardingStep
