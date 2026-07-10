import { useRef, useState, type ComponentProps, type ReactNode } from 'react'
import { blo } from 'blo'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/utils/cn'
import { getInitials, getSafeDisplayInfo, TOOLTIP_DELAY_MS, HOVER_ACTION_CLASS } from './utils'
import CopyAddressButton from './CopyAddressButton'
import ExplorerLinkButton from './ExplorerLinkButton'
import FullAddress from './FullAddress'
import RenameButton from './RenameButton'
import TruncatedText, { shouldOpenTooltip } from './TruncatedText'

export interface SafeInfoDisplayProps {
  name: string
  address: string
  className?: string
  /**
   * Per-chain block explorer link, shown as a hover action next to the copy button — or next to the
   * name when the address is hidden. Pass it only for single-chain rows; a multi-chain summary spans
   * several explorers, so it should be left unset there and moved onto the per-chain child rows.
   */
  explorerLink?: { href: string; title: string }
  /** Shows the rename pencil next to the name when provided. */
  onRename?: () => void
  /** Custom leading element (avatar/icon). Defaults to the built-in blockie avatar. */
  leading?: ReactNode
  /** Hides the address line — e.g. multi-chain child rows that show only a chain name. */
  hideAddress?: boolean
  /** Rendered above the name (e.g. a "High similarity" warning badge). */
  badge?: ReactNode
  /** Typography variant for the name line. Defaults to the compact `paragraph-small-medium`. */
  nameVariant?: ComponentProps<typeof TruncatedText>['variant']
}

const SafeInfoDisplay = ({
  name,
  address,
  className,
  explorerLink,
  onRename,
  leading,
  hideAddress,
  badge,
  nameVariant = 'paragraph-small-medium',
}: SafeInfoDisplayProps) => {
  const { displayName } = getSafeDisplayInfo(name, address)
  const addressMiddleRef = useRef<HTMLSpanElement>(null)
  const [addressTooltipOpen, setAddressTooltipOpen] = useState(false)

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="relative shrink-0">
        {leading ?? (
          <Avatar size="sm">
            <AvatarImage src={blo(address as `0x${string}`)} alt={displayName} />
            <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
          </Avatar>
        )}
      </div>
      <div className="flex flex-col items-start flex-1 min-w-0">
        {badge}
        <div className="flex items-center gap-1 min-w-0 max-w-full">
          <TruncatedText variant={nameVariant} className="block min-w-0" text={displayName} />
          {onRename && <RenameButton onRename={onRename} className={HOVER_ACTION_CLASS} />}
          {/* With no address line to host it (e.g. a multi-chain child showing only its chain name),
              the explorer link rides alongside the name instead. */}
          {hideAddress && explorerLink && (
            <span className={HOVER_ACTION_CLASS}>
              <ExplorerLinkButton
                href={explorerLink.href}
                title={explorerLink.title}
                testId="safe-item-row-explorer-link"
              />
            </span>
          )}
        </div>
        {!hideAddress && (
          <div className="flex items-center gap-1 min-w-0 max-w-full">
            <Tooltip
              delay={TOOLTIP_DELAY_MS}
              disableHoverablePopup
              open={addressTooltipOpen}
              onOpenChange={(nextOpen, details) =>
                setAddressTooltipOpen(shouldOpenTooltip(nextOpen, details.reason, addressMiddleRef.current))
              }
            >
              <TooltipTrigger render={<span />} className="flex min-w-0">
                <FullAddress address={address} middleRef={addressMiddleRef} data-testid="safe-item-address" />
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
        )}
      </div>
    </div>
  )
}

export default SafeInfoDisplay
