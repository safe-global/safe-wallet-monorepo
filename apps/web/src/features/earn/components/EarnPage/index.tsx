import BlockedAddress from '@/components/common/BlockedAddress'
import useBlockedAddress from '@/hooks/useBlockedAddress'
import useConsent from '@/hooks/useConsent'
import { EARN_CONSENT_STORAGE_KEY } from '../../constants'
import EarnView from '../EarnView'
import { EarnPageView } from '@views/features/earn/components/EarnPage/EarnPageView'

const EarnPage = () => {
  const { isConsentAccepted, onAccept } = useConsent(EARN_CONSENT_STORAGE_KEY)
  const blockedAddress = useBlockedAddress()

  if (blockedAddress) {
    return (
      <EarnPageView
        renderBlockedAddress={(featureTitle) => <BlockedAddress address={blockedAddress} featureTitle={featureTitle} />}
        earnView={null}
        onAccept={onAccept}
      />
    )
  }

  if (isConsentAccepted === undefined) return null

  return <EarnPageView isConsentAccepted={isConsentAccepted} earnView={<EarnView />} onAccept={onAccept} />
}

export default EarnPage
