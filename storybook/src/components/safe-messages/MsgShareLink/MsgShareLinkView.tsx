import type { ReactElement, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Share2 as ShareIcon } from 'lucide-react'
import Track from '@/components/common/Track'
import { MESSAGE_EVENTS } from '@/services/analytics/events/txList'

export type MsgShareLinkViewProps = {
  button?: boolean
  renderCopyTooltip: (props: { initialToolTipText: string; children: ReactNode }) => ReactElement
}

export function MsgShareLinkView({ button, renderCopyTooltip }: MsgShareLinkViewProps): ReactElement {
  return (
    <Track {...MESSAGE_EVENTS.COPY_DEEPLINK}>
      {renderCopyTooltip({
        initialToolTipText: 'Copy the message URL',
        children: button ? (
          <Button data-testid="share-btn" aria-label="Share" size="sm" onClick={() => {}}>
            Copy link
          </Button>
        ) : (
          // eslint-disable-next-line no-restricted-syntax -- circular hover on the icon button; no round icon size variant exists
          <Button data-testid="share-btn" aria-label="Share" variant="ghost" size="icon-xs" className="rounded-full">
            <ShareIcon className="size-4 text-[var(--color-border-main)]" />
          </Button>
        ),
      })}
    </Track>
  )
}
