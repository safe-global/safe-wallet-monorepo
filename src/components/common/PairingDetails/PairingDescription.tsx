import { Typography } from '@mui/material'
import type { ReactElement } from 'react'

import AppStoreButton from '@/components/common/AppStoreButton'
import ExternalLink from '../ExternalLink'
import { HelpCenterArticle } from '@/config/constants'

const PairingDescription = (): ReactElement => {
  return (
    <>
      <Typography variant="caption" align="center">
        Scan this code in the {'BNB Safe{Wallet}'} mobile app to sign transactions with your mobile device.
        <br />
        <ExternalLink href={HelpCenterArticle.MOBILE_SAFE} title="Learn more about mobile pairing.">
          Learn more about this feature.
        </ExternalLink>
      </Typography>

      <AppStoreButton placement="pairing" />
    </>
  )
}

export default PairingDescription
