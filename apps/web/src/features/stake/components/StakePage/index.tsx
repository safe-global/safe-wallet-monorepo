import StakingWidget from '../StakingWidget'
import { useRouter } from 'next/router'
import BlockedAddress from '@/components/common/BlockedAddress'
import useBlockedAddress from '@/hooks/useBlockedAddress'
import useConsent from '@/hooks/useConsent'
import { STAKE_CONSENT_STORAGE_KEY } from '../../constants'
import { StakePageView } from '@views/features/stake/components/StakePage/StakePageView'

const StakePage = () => {
  const { isConsentAccepted, onAccept } = useConsent(STAKE_CONSENT_STORAGE_KEY)
  const router = useRouter()
  const { asset } = router.query

  const blockedAddress = useBlockedAddress()

  if (blockedAddress) {
    return (
      <StakePageView
        renderBlockedAddress={(featureTitle) => <BlockedAddress address={blockedAddress} featureTitle={featureTitle} />}
        stakingWidget={null}
        onAccept={onAccept}
      />
    )
  }

  return (
    <StakePageView
      isConsentAccepted={isConsentAccepted}
      stakingWidget={<StakingWidget asset={String(asset)} />}
      onAccept={onAccept}
    />
  )
}

export default StakePage
