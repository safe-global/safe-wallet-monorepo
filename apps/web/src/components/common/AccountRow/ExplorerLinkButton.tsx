import { ExternalLink } from 'lucide-react'
import RowIconAction from './RowIconAction'

// Tracking-agnostic: pass `onOpen` to fire an analytics event labelled for the call site's surface
// (the component itself no longer emits sidebar-specific events from the table/dropdown).
const ExplorerLinkButton = ({
  href,
  title = 'View on block explorer',
  testId = 'safe-item-explorer-link',
  onOpen,
}: {
  href: string
  title?: string
  testId?: string
  onOpen?: () => void
}) => {
  return (
    <RowIconAction label={title} href={href} testId={testId} onActivate={onOpen}>
      <ExternalLink className="size-3 text-muted-foreground" />
    </RowIconAction>
  )
}

export default ExplorerLinkButton
