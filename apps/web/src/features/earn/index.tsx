import { Stack } from '@mui/material'
import Disclaimer from '@/components/common/Disclaimer'
import WidgetDisclaimer from '@/components/common/WidgetDisclaimer'
import BlockedAddress from '@/components/common/BlockedAddress'
import useBlockedAddress from '@/hooks/useBlockedAddress'
import useConsent from '@/hooks/useConsent'
import { EARN_CONSENT_STORAGE_KEY } from '@/features/earn/constants'
import EarnView from '@/features/earn/components/EarnView'

const EarnPage = () => {
  const { isConsentAccepted, onAccept } = useConsent(EARN_CONSENT_STORAGE_KEY)
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
        <BlockedAddress address={blockedAddress} featureTitle="Earn feature with Kiln" />
      </Stack>
    )
  }

  if (isConsentAccepted === undefined) return null

  return (
    <>
      {isConsentAccepted ? (
        <EarnView />
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
            content={<WidgetDisclaimer widgetName="Earn Widget by Kiln" />}
            onAccept={onAccept}
            buttonText="Continue"
          />
        </Stack>
      )}
    </>
  )
}

export default EarnPage
