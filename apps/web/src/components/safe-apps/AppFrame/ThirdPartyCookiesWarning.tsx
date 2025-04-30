import React from 'react'
import { Alert, AlertTitle } from '@mui/material'
import ExternalLink from '@/components/common/ExternalLink'

import { HelpCenterArticle } from '@safe-global/utils/config/constants'

type ThirdPartyCookiesWarningProps = {
  onClose: () => void
}

export const ThirdPartyCookiesWarning = ({ onClose }: ThirdPartyCookiesWarningProps): React.ReactElement => {
  return (
    <Alert
      severity="warning"
      onClose={onClose}
      sx={({ palette }) => ({
        background: palette.warning.light,
        border: 0,
        borderBottom: `1px solid ${palette.warning.main}`,
        borderRadius: '0px !important',
      })}
    >
      <AlertTitle>
        Third party cookies are disabled. Safe Apps may therefore not work properly. You can find out more information
        about this{' '}
        <ExternalLink href={HelpCenterArticle.COOKIES} fontSize="inherit">
          here
        </ExternalLink>
      </AlertTitle>
    </Alert>
  )
}
