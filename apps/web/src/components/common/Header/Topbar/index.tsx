import { useRef, type ReactElement } from 'react'

import { HeaderNavigation } from '@/features/spaces/components/HeaderNavigation'
import { useLoadFeature } from '@/features/__core__'
import { WalletFeature, useWalletPopover } from '@/features/wallet'
import NotificationsPopover, { type NotificationsPopoverRef } from './NotificationsPopover'

const Topbar = (): ReactElement => {
  const {
    wallet,
    open: walletOpen,
    anchorEl: walletAnchorEl,
    handleClick: handleWalletClick,
    handleClose: handleWalletClose,
  } = useWalletPopover()
  const { WalletPopover } = useLoadFeature(WalletFeature)
  const notificationsRef = useRef<NotificationsPopoverRef>(null)

  return (
    <>
      <header className="flex items-center p-6  pb-0 justify-end bg-secondary">
        <HeaderNavigation
          walletAddress={wallet?.address ?? ''}
          messages={notificationsRef.current?.unreadCount ?? 0}
          onNotificationsClick={(e) => notificationsRef.current?.handleClick(e)}
          onWalletClick={handleWalletClick}
        />
      </header>

      <NotificationsPopover ref={notificationsRef} />

      {wallet && (
        <WalletPopover wallet={wallet} open={walletOpen} anchorEl={walletAnchorEl} onClose={handleWalletClose} />
      )}
    </>
  )
}

export default Topbar
