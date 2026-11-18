import dynamic from '@/utils/dynamic'

// Not gated: the spaces feature is always enabled
const SurveyOnboarding = dynamic(() => import('../components/SurveyOnboarding'))

export default SurveyOnboarding
