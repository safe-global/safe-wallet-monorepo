import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const HnSecuritySection = gatedDynamic(FEATURES.HYPERNATIVE, () => import('../components/HnSecuritySection'))

export default HnSecuritySection
