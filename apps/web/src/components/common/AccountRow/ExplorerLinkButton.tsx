import { ExternalLink } from 'lucide-react'
import { OVERVIEW_EVENTS, trackEvent, MixpanelEventParams } from '@/services/analytics'
import RowIconAction from './RowIconAction'

const ExplorerLinkButton = ({
  href,
  title = 'View on block explorer',
  testId = 'safe-item-explorer-link',
}: {
  href: string
  title?: string
  testId?: string
}) => {
  const trackOpen = () =>
    trackEvent(OVERVIEW_EVENTS.OPEN_EXPLORER, { [MixpanelEventParams.SIDEBAR_ELEMENT]: 'Block Explorer' })

  return (
    <RowIconAction label={title} href={href} testId={testId} onActivate={trackOpen}>
      <ExternalLink className="size-3 text-muted-foreground" />
    </RowIconAction>
  )
}

export default ExplorerLinkButton
