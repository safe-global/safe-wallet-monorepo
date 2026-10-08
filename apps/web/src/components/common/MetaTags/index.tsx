import { BRAND_NAME, IS_PRODUCTION, IS_BEHIND_IAP } from '@/config/constants'
import { ContentSecurityPolicy, StrictTransportSecurity } from '@/config/securityHeaders'
import { lightPalette, darkPalette } from '@safe-global/theme/palettes'
import { MetaTagsView } from '@views/components/common/MetaTags/MetaTagsView'

const MetaTags = ({ prefetchUrl }: { prefetchUrl: string }) => (
  <MetaTagsView
    prefetchUrl={prefetchUrl}
    brandName={BRAND_NAME}
    isProduction={IS_PRODUCTION}
    isBehindIap={IS_BEHIND_IAP}
    contentSecurityPolicy={ContentSecurityPolicy}
    strictTransportSecurity={StrictTransportSecurity}
    themeColorLight={lightPalette.background.main}
    themeColorDark={darkPalette.background.main}
  />
)

export default MetaTags
