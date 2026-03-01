import { useMemo, useRef, type ReactElement } from 'react'

import { HeaderNavigation } from '@/features/spaces/components/HeaderNavigation'
import { useLoadFeature } from '@/features/__core__'
import { WalletFeature, useWalletPopover } from '@/features/wallet'
import { useAppSelector } from '@/store'
import { selectNotifications } from '@/store/notificationsSlice'
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
  const notifications = useAppSelector(selectNotifications)
  const unreadCount = useMemo(() => notifications.filter(({ isRead }) => !isRead).length, [notifications])

  return (
    <>
      <header className="flex items-center p-6  pb-0 justify-end bg-secondary">
        <HeaderNavigation
          walletAddress={wallet?.address ?? ''}
          messages={unreadCount}
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
