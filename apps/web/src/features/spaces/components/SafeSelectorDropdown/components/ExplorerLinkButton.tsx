import { type MouseEvent, type PointerEvent } from 'react'
import { ExternalLink } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { OVERVIEW_EVENTS, trackEvent, MixpanelEventParams } from '@/services/analytics'

// Opens the current safe on its block explorer. Rendered inside the Select trigger next to the copy
// button, so pointerdown is stopped from reaching the surrounding trigger (which would otherwise
// toggle the dropdown); the anchor's click still navigates and opens the explorer in a new tab.
const ExplorerLinkButton = ({ href, title = 'View on block explorer' }: { href: string; title?: string }) => {
  // preventDefault on pointerdown does not cancel the synthetic click, so navigation still happens.
  const stopParent = (e: MouseEvent | PointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
  }

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation()
    trackEvent(OVERVIEW_EVENTS.OPEN_EXPLORER, { [MixpanelEventParams.SIDEBAR_ELEMENT]: 'Block Explorer' })
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            onClick={handleClick}
            onPointerDown={stopParent}
            className="shrink-0 rounded p-0.5 hover:bg-muted transition-colors cursor-pointer inline-flex"
            aria-label={title}
            data-testid="safe-item-explorer-link"
          />
        }
      >
        <ExternalLink className="size-3 text-muted-foreground" />
      </TooltipTrigger>
      <TooltipContent>{title}</TooltipContent>
    </Tooltip>
  )
}

export default ExplorerLinkButton
