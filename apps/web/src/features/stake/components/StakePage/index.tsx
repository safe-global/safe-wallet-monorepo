import { Stack } from '@mui/material'
import Disclaimer from '@/components/common/Disclaimer'
import WidgetDisclaimer from '@/components/common/WidgetDisclaimer'
import StakingWidget from '../StakingWidget'
import { useRouter } from 'next/router'
import BlockedAddress from '@/components/common/BlockedAddress'
import useBlockedAddress from '@/hooks/useBlockedAddress'
import useConsent from '@/hooks/useConsent'
import { STAKE_CONSENT_STORAGE_KEY } from '@/features/stake/constants'

const StakePage = () => {
  const { isConsentAccepted, onAccept } = useConsent(STAKE_CONSENT_STORAGE_KEY)
  const router = useRouter()
  const { asset } = router.query

  const blockedAddress = useBlockedAddress()

  if (blockedAddress) {
    return (
      <Stack
        direction="column"
        sx={{
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
        }}
      >
        <BlockedAddress address={blockedAddress} featureTitle="stake feature with Kiln" />
      </Stack>
    )
  }

  return (
    <>
      {isConsentAccepted === undefined ? null : isConsentAccepted ? (
        <StakingWidget asset={String(asset)} />
      ) : (
        <Stack
          direction="column"
          sx={{
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
          }}
        >
          <Disclaimer
            title="Note"
            content={<WidgetDisclaimer widgetName="Stake Widget by Kiln" />}
            onAccept={onAccept}
            buttonText="Continue"
          />
        </Stack>
      )}
    </>
  )
}

export default StakePage
