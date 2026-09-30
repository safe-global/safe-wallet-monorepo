import Disclaimer from '@/components/common/Disclaimer'
import WidgetDisclaimer from '@/components/common/WidgetDisclaimer'
import StakingWidget from '../StakingWidget'
import { useRouter } from 'next/router'
import BlockedAddress from '@/components/common/BlockedAddress'
import useBlockedAddress from '@/hooks/useBlockedAddress'
import useConsent from '@/hooks/useConsent'
import { STAKE_CONSENT_STORAGE_KEY } from '../../constants'

const StakePage = () => {
  const { isConsentAccepted, onAccept } = useConsent(STAKE_CONSENT_STORAGE_KEY)
  const router = useRouter()
  const { asset } = router.query

  const blockedAddress = useBlockedAddress()

  if (blockedAddress) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <BlockedAddress address={blockedAddress} featureTitle="stake feature with Kiln" />
      </div>
    )
  }

  return (
    <>
      {isConsentAccepted === undefined ? null : isConsentAccepted ? (
        <StakingWidget asset={String(asset)} />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center">
          <Disclaimer
            title="Note"
            content={<WidgetDisclaimer widgetName="Stake Widget by Kiln" />}
            onAccept={onAccept}
            buttonText="Continue"
          />
        </div>
      )}
    </>
  )
}

export default StakePage
