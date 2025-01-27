import type { ReactElement } from 'react'
import { AppRoutes } from '@/config/routes'
import { useRouter } from 'next/router'
import Track from '@/components/common/Track'
import type { AnalyticsEvent } from '@/services/analytics'
import React from 'react'
import CopyTooltip from '@/components/common/CopyTooltip'
import useOrigin from '@/hooks/useOrigin'

const TxShareLink = ({
  id,
  children,
  event,
}: {
  id: string
  children: ReactElement
  event: AnalyticsEvent
}): ReactElement => {
  const router = useRouter()
  const { safe = '' } = router.query
  const href = `${AppRoutes.transactions.tx}?safe=${safe}&id=${id}`
  const txUrl = useOrigin() + href

  return (
    <Track {...event}>
      <CopyTooltip text={txUrl} initialToolTipText="Copy the transaction URL">
        {children}
      </CopyTooltip>
    </Track>
  )
}

export default TxShareLink
