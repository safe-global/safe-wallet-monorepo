import type { Dispatch, SetStateAction } from 'react'
import { useMemo, useRef, type ReactElement } from 'react'
import { Menu } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { HeaderNavigation } from '@/features/spaces/components/HeaderNavigation'
import { useLoadFeature } from '@/features/__core__'
import { WalletFeature, useWalletPopover } from '@/features/wallet'
import { WalletConnectFeature } from '@/features/walletconnect'
import { useDraftBatch } from '@/features/batching'
import { useIsMobile } from '@/hooks/use-mobile'
import { useAppSelector } from '@/store'
import { selectNotifications } from '@/store/notificationsSlice'
import useSafeAddress from '@/hooks/useSafeAddress'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { useIsWalletProposer } from '@/hooks/useProposers'
import { useIsSpaceRoute } from '@/hooks/useIsSpaceRoute'
import NotificationsPopover, { type NotificationsPopoverRef } from './NotificationsPopover'
import { useCurrentSpaceId } from '@/features/spaces'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import SpaceSafeBar from '@/components/common/SpaceSafeBar'
import SafenetStakingButton from './SafenetStakingButton'
import { useSafeTokenEnabled } from '@/hooks/useSafeTokenEnabled'

interface TopbarProps {
  /** When provided, shows a menu button on mobile to open the sidebar */
  onMenuToggle?: Dispatch<SetStateAction<boolean>>
  /** When provided, toggles the batch sidebar (Safe routes only) */
  onBatchToggle?: Dispatch<SetStateAction<boolean>>
}

const Topbar = ({ onMenuToggle, onBatchToggle }: TopbarProps): ReactElement => {
  const isMobile = useIsMobile()
  const {
    wallet,
    open: walletOpen,
    anchorEl: walletAnchorEl,
    handleClick: handleWalletClick,
    handleClose: handleWalletClose,
  } = useWalletPopover()
  const { WalletPopover } = useLoadFeature(WalletFeature)
  const { WalletConnectWidget } = useLoadFeature(WalletConnectFeature)
  const notificationsRef = useRef<NotificationsPopoverRef>(null)
  const notifications = useAppSelector(selectNotifications)
  const spaceId = useCurrentSpaceId()
  const isSpaceRoute = useIsSpaceRoute()
  const safeAddress = useSafeAddress()
  const isProposer = useIsWalletProposer()
  const isSafeOwner = useIsSafeOwner()
  const draftBatch = useDraftBatch()
  const showSafeToken = useSafeTokenEnabled()

  const showBatchButton = Boolean(safeAddress && (!isProposer || isSafeOwner))

  const handleWalletSwitch = () => {
    if (!spaceId) return
    trackEvent({ ...SPACE_EVENTS.WALLET_SWITCHED, label: spaceId }, { spaceId })
  }

  const handleWalletDisconnect = () => {
    if (!spaceId) return
    trackEvent({ ...SPACE_EVENTS.WALLET_DISCONNECTED, label: spaceId }, { spaceId })
  }

  const unreadCount = useMemo(() => notifications.filter(({ isRead }) => !isRead).length, [notifications])
  const showMenuButton = Boolean(onMenuToggle && isMobile)

  return (
    <>
      <header
        className={`flex flex-wrap items-center px-6 py-4 bg-secondary dark:bg-background ${
          showMenuButton ? 'justify-between pl-2' : 'justify-between'
        }`}
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

        {/* Left content */}
        <div className="flex-1 min-w-0 max-md:order-last max-md:basis-full max-md:mt-2">
          {isSpaceRoute ? (
            // TODO: Global search
            <div />
          ) : (
            <SpaceSafeBar />
          )}
        </div>

        {/* Right content: navigation buttons */}
        <div className="flex items-center gap-1 shrink-0 max-md:ml-auto">
          {showSafeToken && (
            <div className="hidden sm:block">
              <SafenetStakingButton />
            </div>
          )}

          <HeaderNavigation
            walletAddress={wallet?.address ?? ''}
            walletEns={wallet?.ens}
            isConnected={Boolean(wallet)}
            walletIcon={wallet?.icon}
            walletLabel={wallet?.label}
            walletOpen={walletOpen}
            messages={unreadCount}
            showSearch={!isSpaceRoute}
            onNotificationsClick={(e) => notificationsRef.current?.handleClick(e)}
            onWalletClick={handleWalletClick}
            walletConnectSlot={<WalletConnectWidget />}
            showBatch={!isSpaceRoute && showBatchButton}
            batchCount={draftBatch.length}
            onBatchClick={() => onBatchToggle?.((open) => !open)}
          />
        </div>
      </header>

      <NotificationsPopover ref={notificationsRef} />

      {wallet && (
        <WalletPopover
          wallet={wallet}
          open={walletOpen}
          anchorEl={walletAnchorEl}
          onClose={handleWalletClose}
          onWalletSwitch={handleWalletSwitch}
          onWalletDisconnect={handleWalletDisconnect}
        />
      )}
    </>
  )
}

export default Topbar
