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
import { selectNotifications } from '@/store/notificationsSlice'
import { openGlobalSearch } from '@/features/global-search/store'
import { useWalletName } from '@/hooks/wallets/useWalletName'
import useSafeAddress from '@/hooks/useSafeAddress'
import { useSafeAddressFromUrl } from '@/hooks/useSafeAddressFromUrl'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { useIsWalletProposer } from '@/hooks/useProposers'
import { useIsSpaceRoute } from '@/hooks/useIsSpaceRoute'
import NotificationsPopover, { type NotificationsPopoverRef } from './NotificationsPopover'
import { useCurrentSpaceId } from '@/features/spaces'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import SafeLogo from '@/components/common/SafeLogo'
import SpaceSafeBar from '@/components/common/SpaceSafeBar'
import SafenetStakingButton from './SafenetStakingButton'
import { useSafeTokenEnabled } from '@/hooks/useSafeTokenEnabled'
import { TxModalContext } from '@/components/tx-flow'
import { cn } from '@/utils/cn'

// The safe selector and the actions card need ~1250px to sit side by side, so below a 1260px header
// container (a container query, so it accounts for the sidebar and the route) each takes its own
// full-width row — same order and same left edge at every width.
//
// The previous rules moved things around instead: `order-1` flipped the two groups at 1100px, so the
// actions jumped above the selector, and `ml-auto` stayed in force between 1100px and the width where
// they actually stopped fitting, leaving the selector top-left and the actions bottom-right on a
// diagonal. `min-[900px]` also mixed a viewport breakpoint into a container-driven rule.
//
// The logo variant is 24px and always fits, so it opts out of both. Named so the Topbar tests can
// assert which left-slot variant opts in without restating the utility list.
//
// Only the context slot gets `basis-full` — that alone consumes the line and pushes the actions onto
// the next one. The actions must NOT repeat it: `flex-basis: 100%` sets a flex item's *width*, and
// unlike the invisible context slot the actions are a painted card, so it stretched to the full row
// with its chips (~295px) marooned at the left of ~950px of empty white. It only needs `ml-0` to
// drop the `ml-auto` that right-aligns it while the two share a row.
//
// No `justify-end` below md either: it right-aligned the context inside its full-width slot while the
// actions stayed left, putting the two wrapped rows on a diagonal. The stretched card used to hide
// that. Both rows now start on the page's left padding at every width.
export const WIDE_CONTEXT_WRAP = '@max-[1260px]:basis-full'
export const WIDE_ACTIONS_WRAP = '@max-[1260px]:ml-0'

interface TopbarProps {
  /** When provided, shows a menu button on mobile to open the sidebar */
  onMenuToggle?: Dispatch<SetStateAction<boolean>>
  /** When provided, toggles the batch sidebar (Safe routes only) */
  onBatchToggle?: Dispatch<SetStateAction<boolean>>
}

const Topbar = ({ onMenuToggle, onBatchToggle }: TopbarProps): ReactElement => {
  const dispatch = useAppDispatch()
  // Below `md` the sidebar is closed and rendered as an overlay,
  // so the burger needs to appear on the same range to keep it reachable.
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
  const notifications = useAppSelector(selectNotifications)
  const spaceId = useCurrentSpaceId()
  const isSpaceRoute = useIsSpaceRoute()
  const pathname = usePathname()
  const isWelcomeListRoute = pathname === AppRoutes.welcome.accounts || pathname === AppRoutes.welcome.spaces
  const urlSafeAddress = useSafeAddressFromUrl()
  const isSettingsWithoutSafe = pathname?.startsWith(AppRoutes.settings.index) === true && !urlSafeAddress
  // Routes with no Safe context show the bare logo on the left instead of the safe selector or
  // the search input. It's a 24px mark that always fits beside the actions, so it opts out of
  // the wrapping the two wide variants need — logo left, actions right, at every width.
  const showLogo = isSettingsWithoutSafe || isWelcomeListRoute
  const safeAddress = useSafeAddress()
  const isProposer = useIsWalletProposer()
  const isSafeOwner = useIsSafeOwner()
  const draftBatch = useDraftBatch()
  const showSafeToken = useSafeTokenEnabled()
  const { txFlow } = useContext(TxModalContext)

  // On space routes we show the global search input by default, but when a transaction
  // modal is open (e.g. Send via the Actions Tray) the URL keeps the space pathname —
  // swap in the SpaceSafeBar so the user can see the Safe they're transacting against.
  const showSpaceSafeBar = !isSpaceRoute || Boolean(txFlow)

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
          // The logo row is short, so center it against the taller actions card. The wide
          // variants keep their own top alignment.
          showLogo ? 'items-center' : 'items-start',
          showMenuButton && 'pl-2',
        )}
      >
        {/* Left content (context): the safe selector must not shrink so its children stay on
            one line. See WIDE_CONTEXT_WRAP for how the wide variants wrap. `h-14` matches the
            actions card's 56px height and gives the search input's `h-full` a definite parent.

            The burger lives in here rather than beside it: the wide variants are `basis-full`, so a
            sibling burger could never share their line and got stranded on a row of its own. */}
        <div className={cn('shrink-0 flex items-center gap-2', !showLogo && cn('h-14', WIDE_CONTEXT_WRAP))}>
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

          {showLogo ? (
            <SafeLogo />
          ) : showSpaceSafeBar ? (
            <SpaceSafeBar />
          ) : (
            <GlobalSearchInput className="h-full w-64 rounded-3xl md:w-80" />
          )}
        </div>

        {/* Right content (actions): ml-auto pushes it to the right page padding. One 56px card
            holding the muted action chips, matching the safe-selector pill. See WIDE_ACTIONS_WRAP
            for how it gives that up when the wide context variants wrap below it.

            `flex-wrap min-w-0` and no `shrink-0`: the chips add up to ~403px, so on a 375px screen the
            cluster ran 36px past the header. `shrink-0` was why — it stopped the card ever narrowing
            enough for the chips to wrap, so they just spilled. Letting it shrink means they reflow
            onto a second row inside the card instead. */}
        <div
          className={cn(
            'flex min-w-0 flex-wrap items-center gap-1 ml-auto rounded-xl bg-card p-2 shadow-[0px_4px_20px_0px_rgba(0,0,0,0.03)]',
            !showLogo && WIDE_ACTIONS_WRAP,
          )}
        >
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
