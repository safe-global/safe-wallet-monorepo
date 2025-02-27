import { IconButton, Link, SvgIcon } from '@mui/material'
import React from 'react'
import type { ReactElement } from 'react'

import ShareIcon from '@/public/images/common/share.svg'
import TxShareLink from './TxShareLink'
import { CopyDeeplinkLabels } from '@/services/analytics'

export function TxShareButton({ txId }: { txId: string }): ReactElement {
  return (
    <TxShareLink id={txId} eventLabel={CopyDeeplinkLabels.button}>
      <IconButton data-testid="share-btn" component={Link} aria-label="Share">
        <SvgIcon component={ShareIcon} inheritViewBox fontSize="small" color="border" />
      </IconButton>
    </TxShareLink>
  )
}
