import dynamic from '@/utils/dynamic'

// Not gated: Safe Shield runs on every chain, and its checks use their own flags
const SafeShieldWidget = dynamic(() => import('../../components/SafeShieldWidget'))

export default SafeShieldWidget
