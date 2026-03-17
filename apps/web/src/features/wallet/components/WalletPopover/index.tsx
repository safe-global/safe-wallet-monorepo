import type { ReactElement } from 'react'
import Popover from '@mui/material/Popover'
import Paper from '@mui/material/Paper'

import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'
import WalletInfo from '@/components/common/WalletInfo'
import walletCss from '@/components/common/ConnectWallet/styles.module.css'

type WalletPopoverProps = {
  wallet: ConnectedWallet
  open: boolean
  anchorEl: HTMLButtonElement | null
  onClose: () => void
}

const WalletPopover = ({ wallet, open, anchorEl, onClose }: WalletPopoverProps): ReactElement => {
  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      sx={{ mt: 1 }}
      transitionDuration={0}
    >
      <Paper className={walletCss.popoverContainer}>
        <WalletInfo wallet={wallet} balance={wallet.balance} handleClose={onClose} />
      </Paper>
    </Popover>
  )
}

export default WalletPopover
