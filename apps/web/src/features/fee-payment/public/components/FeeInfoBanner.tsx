import dynamic from '@/utils/dynamic'

// No feature flag: Pay from Safe is an option of the chain's relayer, which the banner's slot checks.
const FeeInfoBanner = dynamic(() => import('../../components/FeeInfoBanner'))

export default FeeInfoBanner
