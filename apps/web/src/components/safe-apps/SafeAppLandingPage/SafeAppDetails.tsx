import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import ChainIndicator from '@/components/common/ChainIndicator'
import { SafeAppDetailsView } from '@views/components/safe-apps/SafeAppLandingPage/SafeAppDetailsView'

type DetailsProps = {
  app: SafeAppData
  showDefaultListWarning: boolean
}

const SafeAppDetails = ({ app, showDefaultListWarning }: DetailsProps) => (
  <SafeAppDetailsView
    app={app}
    showDefaultListWarning={showDefaultListWarning}
    renderChainIndicator={(chainId) => <ChainIndicator key={chainId} chainId={chainId} inline showUnknown={false} />}
  />
)

export { SafeAppDetails }
