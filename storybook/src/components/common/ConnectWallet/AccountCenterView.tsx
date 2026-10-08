import type { ReactElement, ReactNode } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import css from '@/components/common/ConnectWallet/styles.module.css'
import { ChevronUp, ChevronDown } from 'lucide-react'

export type AccountCenterViewProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  overview: ReactNode
  walletInfo: ReactNode
}

export function AccountCenterView({ open, onOpenChange, overview, walletInfo }: AccountCenterViewProps): ReactElement {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger
        render={<button type="button" className="flex self-stretch text-left" />}
        data-testid="open-account-center"
      >
        <div className={`${css.buttonContainer} ${css.connectedButton}`}>
          {overview}

          <div className="ml-auto flex items-center justify-end text-[var(--color-border-main)]">
            {open ? <ChevronUp className="size-4" /> : <ChevronDown data-testid="ExpandMoreIcon" className="size-4" />}
          </div>
        </div>
      </PopoverTrigger>

      <PopoverContent
        showBackdrop
        align="center"
        side="bottom"
        sideOffset={0}
        className="w-auto overflow-hidden rounded-3xl border-0 p-0 ring-0 shadow-none"
      >
        <div className={css.popoverContainer}>{walletInfo}</div>
      </PopoverContent>
    </Popover>
  )
}
