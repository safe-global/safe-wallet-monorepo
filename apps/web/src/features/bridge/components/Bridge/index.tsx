import { AppRoutes } from '@/config/routes'
import { FeatureWrapper } from '@/components/wrappers/FeatureWrapper'
import { SanctionWrapper } from '@/components/wrappers/SanctionWrapper'
import { DisclaimerWrapper } from '@/components/wrappers/DisclaimerWrapper'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { LOCAL_STORAGE_CONSENT_KEY } from '../../constants'
import { BridgeWidget } from '../BridgeWidget'

export function Bridge() {
  return (
    <FeatureWrapper feature={FEATURES.BRIDGE} fallbackRoute={AppRoutes.home}>
      <SanctionWrapper featureTitle="bridge feature with LI.FI">
        <DisclaimerWrapper localStorageKey={LOCAL_STORAGE_CONSENT_KEY} widgetName="Bridging Widget by LI.FI">
          <BridgeWidget />
        </DisclaimerWrapper>
      </SanctionWrapper>
    </FeatureWrapper>
  )
}
