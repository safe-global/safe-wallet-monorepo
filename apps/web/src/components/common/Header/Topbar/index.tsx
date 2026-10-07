import type { Dispatch, SetStateAction } from 'react'
import { useContext, useMemo, useRef, type ReactElement } from 'react'
import { Menu } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AppRoutes } from '@/config/routes'
import { HeaderNavigation, HeaderAccountInfo } from '@/features/spaces'
import { useLoadFeature } from '@/features/__core__'
import { WalletFeature, useWalletPopover } from '@/features/wallet'
import { GlobalSearchFeature } from '@/features/global-search'
import { WalletConnectFeature } from '@/features/walletconnect'
import { useDraftBatch } from '@/features/batching'
import { useIsBelowMd } from '@/hooks/useMediaQuery'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectCenterNotifications } from '@/store/notificationsSlice'
import { openGlobalSearch } from '@/features/global-search/store'
import { useWalletName } from '@/hooks/wallets/useWalletName'
import useSafeAddress from '@/hooks/useSafeAddress'
import { useSafeAddressFromUrl } from '@/hooks/useSafeAddressFromUrl'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { useIsWalletProposer } from '@/hooks/useProposers'
import { useIsSpaceRoute } from '@/hooks/useIsSpaceRoute'
import NotificationsPopover, { type NotificationsPopoverRef } from './NotificationsPopover'
import { ICON_STROKE } from '@/components/common/iconStroke'
import { useCurrentSpaceId } from '@/features/spaces'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import SafeLogo from '@/components/common/SafeLogo'
import SpaceSafeBar from '@/components/common/SpaceSafeBar'
import SafenetStakingButton from './SafenetStakingButton'
import { useSafeTokenEnabled } from '@/hooks/useSafeTokenEnabled'
import { TxModalContext } from '@/components/tx-flow'
import { cn } from '@/utils/cn'

// Wrap thresholds sit just above each variant's measured pair width (container content box, px-6 excluded).
export const SEARCH_CONTEXT_HEIGHT = 'h-14'
export const SAFE_BAR_CONTEXT_HEIGHT = 'min-h-14'
export const SEARCH_CONTEXT_WRAP = '@max-[660px]:order-last @max-[660px]:basis-full'
export const SAFE_BAR_CONTEXT_WRAP = '@max-[1150px]:order-last @max-[1150px]:basis-full'

interface TopbarProps {
  onMenuToggle?: Dispatch<SetStateAction<boolean>>
  onBatchToggle?: Dispatch<SetStateAction<boolean>>
}

const Topbar = ({ onMenuToggle, onBatchToggle }: TopbarProps): ReactElement => {
  const dispatch = useAppDispatch()
  const isBelowMd = useIsBelowMd()
  const {
    wallet,
    open: walletOpen,
    anchorEl: walletAnchorEl,
    handleClick: handleWalletClick,
    handleClose: handleWalletClose,
  } = useWalletPopover()
  const walletName = useWalletName(wallet)
  const { WalletPopover } = useLoadFeature(WalletFeature)
  const { GlobalSearchModal, GlobalSearchInput } = useLoadFeature(GlobalSearchFeature)
  const { WalletConnectWidget } = useLoadFeature(WalletConnectFeature)
  const notificationsRef = useRef<NotificationsPopoverRef>(null)
  const notifications = useAppSelector(selectCenterNotifications)
  const spaceId = useCurrentSpaceId()
  const isSpaceRoute = useIsSpaceRoute()
  const pathname = usePathname()
  const isWelcomeListRoute = pathname === AppRoutes.welcome.accounts || pathname === AppRoutes.welcome.spaces
  const urlSafeAddress = useSafeAddressFromUrl()
  const isSettingsWithoutSafe = pathname?.startsWith(AppRoutes.settings.index) === true && !urlSafeAddress
  const isPoliciesRoute = pathname === AppRoutes.spaces.policies
  const showLogo = isSettingsWithoutSafe || isWelcomeListRoute || isPoliciesRoute
  const safeAddress = useSafeAddress()
  const isProposer = useIsWalletProposer()
  const isSafeOwner = useIsSafeOwner()
  const draftBatch = useDraftBatch()
  const showSafeToken = useSafeTokenEnabled()
  const { txFlow } = useContext(TxModalContext)

  const showSpaceSafeBar = !isSpaceRoute || (Boolean(txFlow) && Boolean(safeAddress))

  const contextWrap = showLogo ? undefined : showSpaceSafeBar ? SAFE_BAR_CONTEXT_WRAP : SEARCH_CONTEXT_WRAP
  const contextHeight = showLogo ? undefined : showSpaceSafeBar ? SAFE_BAR_CONTEXT_HEIGHT : SEARCH_CONTEXT_HEIGHT

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
  const showMenuButton = Boolean(onMenuToggle && isBelowMd)

  return (
    <>
      <header
        className={cn(
          '@container flex flex-wrap gap-y-2 px-6 pt-6 pb-4 bg-secondary dark:bg-background',
          showLogo ? 'items-center' : 'items-start',
          showMenuButton && 'pl-2',
        )}
      >
        {showMenuButton ? (
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => onMenuToggle?.((open) => !open)}
            aria-label="Open sidebar menu"
          >
            <Menu className="size-5" strokeWidth={ICON_STROKE} />
          </Button>
        ) : null}

        <div className={cn('mr-auto shrink-0 flex items-center', contextHeight, contextWrap)}>
          {showLogo ? (
            <SafeLogo />
          ) : showSpaceSafeBar ? (
            <SpaceSafeBar />
          ) : (
            <GlobalSearchInput className="h-full w-64 rounded-3xl md:w-80" />
          )}
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-1 rounded-xl bg-card p-2 shadow-[0px_4px_20px_0px_rgba(0,0,0,0.03)]">
          {showSafeToken && (
            <div className="hidden sm:block">
              <SafenetStakingButton />
            </div>
          )}

          <HeaderNavigation
            walletAddress={wallet?.address ?? ''}
            walletEns={walletName}
            isConnected={Boolean(wallet)}
            walletIcon={wallet?.icon}
            walletLabel={wallet?.label}
            walletOpen={walletOpen}
            messages={unreadCount}
            showSearch={!isSpaceRoute && !isWelcomeListRoute}
            onSearchClick={() => dispatch(openGlobalSearch())}
            onNotificationsClick={(e) => notificationsRef.current?.handleClick(e)}
            onWalletClick={handleWalletClick}
            walletConnectSlot={<WalletConnectWidget />}
            showBatch={!isSpaceRoute && showBatchButton}
            batchCount={draftBatch.length}
            onBatchClick={() => onBatchToggle?.((open) => !open)}
          />

          <HeaderAccountInfo />
        </div>
      </header>

      <GlobalSearchModal />

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
