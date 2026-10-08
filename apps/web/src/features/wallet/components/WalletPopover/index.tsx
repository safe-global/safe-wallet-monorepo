import type { ReactElement } from 'react'

import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'
import WalletInfo from '@/components/common/WalletInfo'
import { WalletPopoverView } from '@views/features/wallet/components/WalletPopover/WalletPopoverView'

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
    <WalletPopoverView
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      walletInfo={
        <WalletInfo
          wallet={wallet}
          balance={wallet.balance}
          handleClose={onClose}
          onSwitch={onWalletSwitch}
          onDisconnect={onWalletDisconnect}
        />
      }
    />
  )
}

export default WalletPopover
