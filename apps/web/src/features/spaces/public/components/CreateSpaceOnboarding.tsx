import dynamic from '@/utils/dynamic'

// Not gated: the spaces feature is always enabled
const CreateSpaceOnboarding = dynamic(() => import('../../components/CreateSpaceOnboarding'))

export default CreateSpaceOnboarding
