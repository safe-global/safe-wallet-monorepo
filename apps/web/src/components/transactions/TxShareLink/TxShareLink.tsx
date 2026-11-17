import type { ReactElement } from 'react'
import { AppRoutes } from '@/config/routes'
import { useRouter } from 'next/router'
import Track from '@/components/common/Track'
import type { CopyDeeplinkLabels } from '@/services/analytics'
import { TX_LIST_EVENTS } from '@/services/analytics'
import React from 'react'
import CopyTooltip from '@/components/common/CopyTooltip'
import useOrigin from '@/hooks/useOrigin'
import { withSpaceIdInUrl, useUrlSpaceId } from '@/hooks/useUrlSpaceId'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope/context'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeAddress from '@/hooks/useSafeAddress'

const TxShareLink = ({
  id,
  children,
  eventLabel,
}: {
  id: string
  children: ReactElement
  eventLabel: CopyDeeplinkLabels
}): ReactElement => {
  const { safe: urlSafe = '' } = useRouter().query
  const scope = useSafeScope()
  const chain = useCurrentChain()
  const safeAddress = useSafeAddress()
  const safe = scope ? (chain ? `${chain.shortName}:${safeAddress}` : '') : urlSafe
  const spaceId = useUrlSpaceId()
  const href = withSpaceIdInUrl(`${AppRoutes.transactions.tx}?safe=${safe}&id=${id}`, spaceId)
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
