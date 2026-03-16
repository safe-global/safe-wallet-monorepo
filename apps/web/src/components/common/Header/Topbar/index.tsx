import type { Dispatch, SetStateAction } from 'react'
import { useMemo, useRef, type ReactElement } from 'react'
import { Menu } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { HeaderNavigation } from '@/features/spaces/components/HeaderNavigation'
import { useLoadFeature } from '@/features/__core__'
import { WalletFeature, useWalletPopover } from '@/features/wallet'
import { useIsMobile } from '@/hooks/use-mobile'
import { useAppSelector } from '@/store'
import { selectNotifications } from '@/store/notificationsSlice'
import NotificationsPopover, { type NotificationsPopoverRef } from './NotificationsPopover'

interface TopbarProps {
  /** When provided, shows a menu button on mobile to open the sidebar */
  onMenuToggle?: Dispatch<SetStateAction<boolean>>
}

const Topbar = ({ onMenuToggle }: TopbarProps): ReactElement => {
  const isMobile = useIsMobile()
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
  const showMenuButton = Boolean(onMenuToggle && isMobile)

  return (
    <>
      <header
        className={`flex items-center p-6 pb-0 bg-secondary -mb-10 dark:bg-background ${showMenuButton ? 'justify-between' : 'justify-end'}`}
      >
        {showMenuButton ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onMenuToggle?.((open) => !open)}
            aria-label="Open sidebar menu"
          >
            <Menu className="size-5" />
          </Button>
        ) : null}
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
