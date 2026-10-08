import type { ReactElement } from 'react'
import { AppRoutes } from '@/config/routes'
import { useRouter } from 'next/router'
import type { CopyDeeplinkLabels } from '@/services/analytics'
import React from 'react'
import CopyTooltip from '@/components/common/CopyTooltip'
import useOrigin from '@/hooks/useOrigin'
import { withSpaceIdInUrl, useUrlSpaceId } from '@/hooks/useUrlSpaceId'
import { TxShareLinkView } from '@views/components/transactions/TxShareLink/TxShareLinkView'

const TxShareLink = ({
  id,
  children,
  eventLabel,
}: {
  id: string
  children: ReactElement
  eventLabel: CopyDeeplinkLabels
}): ReactElement => {
  const router = useRouter()
  const { safe = '' } = router.query
  const spaceId = useUrlSpaceId()
  const href = withSpaceIdInUrl(`${AppRoutes.transactions.tx}?safe=${safe}&id=${id}`, spaceId)
  const txUrl = useOrigin() + href

  return (
    <TxShareLinkView
      eventLabel={eventLabel}
      renderCopyTooltip={({ initialToolTipText, children: tooltipChildren }) => (
        <CopyTooltip text={txUrl} initialToolTipText={initialToolTipText}>
          {tooltipChildren}
        </CopyTooltip>
      )}
    >
      {children}
    </TxShareLinkView>
  )
}

export default TxShareLink
