import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const EmailSignInButton = gatedDynamic(FEATURES.OIDC_AUTH, () => import('../components/EmailSignInButton'))

export default EmailSignInButton
