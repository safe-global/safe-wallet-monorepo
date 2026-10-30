import { useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react'
import { ChevronLeft, type LucideIcon } from 'lucide-react'
import ChainIndicator from '@/components/common/ChainIndicator'
import { Button } from '@safe-global/views/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import Identicon from '@/components/common/Identicon'
import { Typography } from '@safe-global/views/components/ui/typography'
import { AccountProtectionIcon, SafeAddress, type M2Account } from './m2Prototype'

/** How a panel moves to another: only Back, to the account protection panel it was opened from. */
export type PanelNav = {
  onPrevious?: () => void
  onNext?: () => void
  /** Opened from the account protection panel: goes back to it. */
  onBack?: () => void
}

/** Back to account protection; the up and down arrows are gone, so panels don't move through the table. */
export const PanelNavButtons = ({ nav }: { nav: PanelNav }): ReactElement | null =>
  nav.onBack ? (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="surface"
            size="icon"
            // The drawer's close button sits at top-6 right-6; Back takes the same row, one button-width plus a gap to its left.
            className="absolute top-4 right-[60px]"
            aria-label="Back to account protection"
            onClick={nav.onBack}
            data-m2-new="New · Back to account protection"
          />
        }
      >
        <ChevronLeft />
      </TooltipTrigger>
      <TooltipContent>Back to account protection</TooltipContent>
    </Tooltip>
  ) : null

/** The policy's icon tile; when the account's protection checks it, a small badge in the corner says so and opens it. */
export const PolicyIconTile = ({
  Icon,
  onOpenProtection,
}: {
  Icon: LucideIcon
  onOpenProtection?: () => void
}): ReactElement => (
  <div className="relative flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card">
    <Icon className="size-4 text-muted-foreground" />
    {onOpenProtection && (
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              onClick={onOpenProtection}
              aria-label="Open account protection"
              className="absolute -right-1.5 -bottom-1.5 flex size-5 cursor-pointer items-center justify-center rounded-full bg-foreground text-background ring-2 ring-background focus-visible:ring-ring focus-visible:outline-none"
              data-m2-new="New · Checked by protection badge"
            />
          }
        >
          <AccountProtectionIcon className="size-3" aria-hidden />
        </TooltipTrigger>
        <TooltipContent>Checked by account protection</TooltipContent>
      </Tooltip>
    )}
  </div>
)

/** The Safe account the panel is about, always first in its body. */
export const PanelAccount = ({ account }: { account: M2Account }): ReactElement => (
  <div className="flex items-center justify-between gap-3 rounded-lg bg-muted p-3" data-m2-new="New · Panel account">
    <SafeAddress name={account.name} address={account.address} chainId={account.chainId} />
    <ChainIndicator chainId={account.chainId} inline className="min-w-0! justify-end!" />
  </div>
)

/** Every side panel: the account and its status banner stay pinned while the body scrolls; the account shrinks to one line. */
export const PinnedTop = ({ account, children }: { account: M2Account; children?: ReactNode }): ReactElement => {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [isScrolled, setIsScrolled] = useState(false)

  // Any scroll in the panel, captured: past the top, the account shrinks to one line.
  useEffect(() => {
    const onScroll = (event: Event) => {
      const target = event.target
      if (target instanceof HTMLElement && sentinelRef.current && target.contains(sentinelRef.current))
        setIsScrolled(target.scrollTop > 8)
    }
    document.addEventListener('scroll', onScroll, { capture: true, passive: true })
    return () => document.removeEventListener('scroll', onScroll, { capture: true })
  }, [])

  return (
    <>
      <div ref={sentinelRef} aria-hidden className="-mb-6 h-px" />
      <div
        className="sticky top-0 z-10 -mx-6 flex flex-col gap-3 bg-zinc-50 px-6 pb-1 dark:bg-[var(--color-background-main)]"
        data-m2-new="New · Pinned account and banner"
      >
        {isScrolled ? (
          <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
            <Identicon address={account.address} size={20} />
            <Typography variant="paragraph-small-medium" className="truncate">
              {account.name}
            </Typography>
            <ChainIndicator chainId={account.chainId} onlyLogo imageSize={16} />
          </div>
        ) : (
          <PanelAccount account={account} />
        )}
        {children}
      </div>
    </>
  )
}
