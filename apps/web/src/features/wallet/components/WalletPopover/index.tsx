import type { ReactElement } from 'react'

import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'
import WalletInfo from '@/components/common/WalletInfo'
import { Popover, PopoverContent } from '@/components/ui/popover'

type WalletPopoverProps = {
  wallet: ConnectedWallet
  open: boolean
  anchorEl: HTMLButtonElement | null
  onClose: () => void
  onWalletSwitch?: () => void
  onWalletDisconnect?: () => void
}

const WalletPopover = ({
  wallet,
  open,
  anchorEl,
  onClose,
  onWalletSwitch,
  onWalletDisconnect,
}: WalletPopoverProps): ReactElement => {
  return (
    <Popover
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
    >
      <PopoverContent anchor={anchorEl} side="bottom" align="center" sideOffset={8} className="w-[300px]">
        <WalletInfo
          wallet={wallet}
          balance={wallet.balance}
          handleClose={onClose}
          onSwitch={onWalletSwitch}
          onDisconnect={onWalletDisconnect}
        />
      </PopoverContent>
    </Popover>
  )
}

export default WalletPopover
