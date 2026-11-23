import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const OidcSignInOptions = gatedDynamic(FEATURES.OIDC_AUTH, () => import('../../components/OidcSignInOptions'))

export default OidcSignInOptions
