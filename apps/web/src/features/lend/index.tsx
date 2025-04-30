import { useRouter } from 'next/router'
import { Stack } from '@mui/material'
import Disclaimer from '@/components/common/Disclaimer'
import WidgetDisclaimer from '@/components/common/WidgetDisclaimer'
import BlockedAddress from '@/components/common/BlockedAddress'
import useBlockedAddress from '@/hooks/useBlockedAddress'
import LendWidget from '@/features/lend/components/LendWidget'
import useConsent from '@/hooks/useConsent'
import { LEND_CONSENT_STORAGE_KEY } from '@/features/lend/constants'

const LendPage = () => {
  const { isConsentAccepted, onAccept } = useConsent(LEND_CONSENT_STORAGE_KEY)
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
        <BlockedAddress address={blockedAddress} featureTitle="lend feature with Kiln" />
      </Stack>
    )
  }

  if (isConsentAccepted === undefined) return null

  return (
    <>
      {isConsentAccepted ? (
        <LendWidget asset={String(asset)} />
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

export default LendPage
