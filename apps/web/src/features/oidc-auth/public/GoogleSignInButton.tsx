import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const GoogleSignInButton = gatedDynamic(FEATURES.OIDC_AUTH, () => import('../components/GoogleSignInButton'))

export default GoogleSignInButton
