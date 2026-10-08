import type { ReactElement } from 'react'
import Track from '@/components/common/Track'
import type { CopyDeeplinkLabels } from '@/services/analytics'
import { TX_LIST_EVENTS } from '@/services/analytics/events/txList'

export type TxShareLinkViewProps = {
  eventLabel: CopyDeeplinkLabels
  renderCopyTooltip: (props: { initialToolTipText: string; children: ReactElement }) => ReactElement
  children: ReactElement
}

export const TxShareLinkView = ({ eventLabel, renderCopyTooltip, children }: TxShareLinkViewProps): ReactElement => {
  return (
    <Track {...TX_LIST_EVENTS.COPY_DEEPLINK} label={eventLabel}>
      {renderCopyTooltip({ initialToolTipText: 'Copy the transaction URL', children })}
    </Track>
  )
}
