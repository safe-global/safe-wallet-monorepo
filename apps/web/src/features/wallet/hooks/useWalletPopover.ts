import { useState, type MouseEvent } from 'react'

import useWallet from '@/hooks/wallets/useWallet'
import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'

const useWalletPopover = () => {
  const wallet = useWallet()
  const connectWallet = useConnectWallet()
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const open = Boolean(anchorEl)

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (!wallet) {
      connectWallet()
      return
    }
    setAnchorEl(open ? null : event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  return { wallet, open, anchorEl, handleClick, handleClose }
}

export default useWalletPopover
