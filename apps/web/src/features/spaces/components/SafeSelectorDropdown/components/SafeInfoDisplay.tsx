import { blo } from 'blo'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Typography } from '@/components/ui/typography'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/utils/cn'
import { getInitials, getSafeDisplayInfo } from '../utils'
import CopyAddressButton from './CopyAddressButton'
import ExplorerLinkButton from './ExplorerLinkButton'
import FullAddress from './FullAddress'
import RenameButton from './RenameButton'

// Revealed on row hover (rows carry `group/row`) and on keyboard focus. group-focus-visible (not
// group-focus): base-ui parks focus on the last hovered option without ever clearing it, so plain
// focus would keep the actions visible after the pointer has moved on.
const HOVER_ACTION_CLASS =
  'opacity-0 transition-opacity group-hover/row:opacity-100 group-focus-visible/row:opacity-100 focus-within:opacity-100 focus-visible:opacity-100'

// The name/address tooltips are purely informational: they open only after a deliberate hover and
// never catch the pointer (hoverable + pointer-events-none), so moving towards one dismisses it.
const INFO_TOOLTIP_DELAY_MS = 400

export interface SafeInfoDisplayProps {
  name: string
  address: string
  className?: string
  /** Block explorer link for the safe; shown as a hover action next to the copy button. */
  explorerLink?: { href: string; title: string }
  /** Shows the rename pencil next to the name when provided. */
  onRename?: () => void
}

const SafeInfoDisplay = ({ name, address, className, explorerLink, onRename }: SafeInfoDisplayProps) => {
  const { displayName } = getSafeDisplayInfo(name, address)

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="relative shrink-0">
        <Avatar size="sm">
          <AvatarImage src={blo(address as `0x${string}`)} alt={displayName} />
          <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
        </Avatar>
      </div>
      <div className="flex flex-col items-start flex-1 min-w-0">
        <div className="flex items-center gap-1 min-w-0 max-w-full">
          <Tooltip delay={INFO_TOOLTIP_DELAY_MS} disableHoverablePopup>
            <TooltipTrigger render={<span />} className="block min-w-0">
              <Typography variant="paragraph-small-medium" className="block truncate">
                {displayName}
              </Typography>
            </TooltipTrigger>
            <TooltipContent className="pointer-events-none select-none">{displayName}</TooltipContent>
          </Tooltip>
          {onRename && <RenameButton onRename={onRename} className={HOVER_ACTION_CLASS} />}
        </div>
        <div className="flex items-center gap-1 min-w-0 max-w-full">
          <Tooltip delay={INFO_TOOLTIP_DELAY_MS} disableHoverablePopup>
            <TooltipTrigger render={<span />} className="flex min-w-0">
              <FullAddress address={address} data-testid="safe-item-address" />
            </TooltipTrigger>
            <TooltipContent className="pointer-events-none select-none">{address}</TooltipContent>
          </Tooltip>
          <span className={cn('flex items-center gap-0.5', HOVER_ACTION_CLASS)}>
            <CopyAddressButton address={address} testId="safe-item-copy-address" />
            {explorerLink && (
              <ExplorerLinkButton
                href={explorerLink.href}
                title={explorerLink.title}
                testId="safe-item-row-explorer-link"
              />
            )}
          </span>
        </div>
      </div>
    </div>
  )
}

export default SafeInfoDisplay
