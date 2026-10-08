import type { ReactElement, ReactNode } from 'react'
import { Popover, PopoverContent } from '@/components/ui/popover'

export type WalletPopoverViewProps = {
  open: boolean
  anchorEl: HTMLButtonElement | null
  onClose: () => void
  walletInfo: ReactNode
}

export const WalletPopoverView = ({ open, anchorEl, onClose, walletInfo }: WalletPopoverViewProps): ReactElement => {
  return (
    <Popover
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
    >
      <PopoverContent
        showBackdrop
        anchor={anchorEl}
        side="bottom"
        align="center"
        sideOffset={12}
        className="w-[300px] rounded-3xl"
      >
        {walletInfo}
      </PopoverContent>
    </Popover>
  )
}
