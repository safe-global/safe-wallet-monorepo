import type { ReactElement } from 'react'
import { ChevronLeft, type LucideIcon } from 'lucide-react'
import ChainIndicator from '@/components/common/ChainIndicator'
import { Button } from '@safe-global/views/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { AccountProtectionIcon, SafeAddress, type M2Account } from '../m2Prototype'

/** How a panel moves to another: only Back, to the policy enforcement panel it was opened from. */
export type PanelNav = {
  onPrevious?: () => void
  onNext?: () => void
  /** Opened from the policy enforcement panel: goes back to it. */
  onBack?: () => void
}

/** Back to policy enforcement; the up and down arrows are gone, so panels don't move through the table. */
export const PanelNavButtons = ({ nav }: { nav: PanelNav }): ReactElement | null =>
  nav.onBack ? (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Back to policy enforcement"
            onClick={nav.onBack}
            data-m2-new="New · Back to policy enforcement"
          />
        }
      >
        <ChevronLeft />
      </TooltipTrigger>
      <TooltipContent>Back to policy enforcement</TooltipContent>
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
              aria-label="Open policy enforcement"
              className="absolute -right-1.5 -bottom-1.5 flex size-5 cursor-pointer items-center justify-center rounded-full bg-foreground text-background ring-2 ring-background focus-visible:ring-ring focus-visible:outline-none"
              data-m2-new="New · Checked by protection badge"
            />
          }
        >
          <AccountProtectionIcon className="size-3" aria-hidden />
        </TooltipTrigger>
        <TooltipContent>Enforced on this account</TooltipContent>
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
