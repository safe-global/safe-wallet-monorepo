import { AppRoutes } from '@/config/routes'
import { FeatureWrapper } from '@/components/wrappers/FeatureWrapper'
import { SanctionWrapper } from '@/components/wrappers/SanctionWrapper'
import { DisclaimerWrapper } from '@/components/wrappers/DisclaimerWrapper'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { BridgeView } from '@views/features/bridge/components/Bridge/BridgeView'
import { LOCAL_STORAGE_CONSENT_KEY } from '../../constants'
import { BridgeWidget } from '../BridgeWidget'

export function Bridge() {
  return (
    <FeatureWrapper feature={FEATURES.BRIDGE} fallbackRoute={AppRoutes.home}>
      <BridgeView
        widget={<BridgeWidget />}
        renderSanctionWrapper={(featureTitle, children) => (
          <SanctionWrapper featureTitle={featureTitle}>{children}</SanctionWrapper>
        )}
        renderDisclaimerWrapper={(widgetName, children) => (
          <DisclaimerWrapper localStorageKey={LOCAL_STORAGE_CONSENT_KEY} widgetName={widgetName}>
            {children}
          </DisclaimerWrapper>
        )}
      />
    </FeatureWrapper>
  )
}
