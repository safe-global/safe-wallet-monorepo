import type { ReactElement } from 'react'
import { AppRoutes } from '@/config/routes'
import { useRouter } from 'next/router'
import Track from '@/components/common/Track'
import { TX_LIST_EVENTS } from '@/services/analytics'
import React from 'react'
import CopyTooltip from '@/components/common/CopyTooltip'
import useOrigin from '@/hooks/useOrigin'

const TxShareLink = ({
  id,
  children,
  eventLabel,
}: {
  id: string
  children: ReactElement
  eventLabel: 'button' | 'share-block'
}): ReactElement => {
  const router = useRouter()
  const { safe = '' } = router.query
  const href = `${AppRoutes.transactions.tx}?safe=${safe}&id=${id}`
  const txUrl = useOrigin() + href

  return (
    <Track {...TX_LIST_EVENTS.COPY_DEEPLINK} label={eventLabel}>
      <CopyTooltip text={txUrl} initialToolTipText="Copy the transaction URL">
        {children}
      </CopyTooltip>
    </Track>
  )
}

export default TxShareLink
