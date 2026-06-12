import Disclaimer from '@/components/common/Disclaimer'
import WidgetDisclaimer from '@/components/common/WidgetDisclaimer'
import BlockedAddress from '@/components/common/BlockedAddress'
import useBlockedAddress from '@/hooks/useBlockedAddress'
import useConsent from '@/hooks/useConsent'
import { EARN_CONSENT_STORAGE_KEY } from '../../constants'
import EarnView from '../EarnView'

const EarnPage = () => {
  const { isConsentAccepted, onAccept } = useConsent(EARN_CONSENT_STORAGE_KEY)
  const blockedAddress = useBlockedAddress()

  if (blockedAddress) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <BlockedAddress address={blockedAddress} featureTitle="Earn feature with Kiln" />
      </div>
    )
  }

  if (isConsentAccepted === undefined) return null

  return (
    <>
      {isConsentAccepted ? (
        <EarnView />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center">
          <Disclaimer
            title="Note"
            content={<WidgetDisclaimer widgetName="Earn Widget by Kiln" />}
            onAccept={onAccept}
            buttonText="Continue"
          />
        </div>
      )}
    </>
  )
}

export default EarnPage
