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

// The context (left) and actions card (right) share one row until they genuinely stop fitting, then
// the actions keep the top row and the context drops underneath — `order-last` + `basis-full` on the
// context only (the actions are a painted card and would stretch across a full-width row), with
// `ml-0` dropping the actions' right-alignment once stacked. Thresholds are per context variant and
// resolve against the container's content box (px-6 excluded), measured:
//   space route  search 320 + actions 315 =  635  ->  break under 660
//   safe route   bar    655 + actions 479 = 1134  ->  break under 1150
// The threshold must stay ABOVE the pair's real width — below it flexbox wraps unprompted and the
// order utilities never apply — but keep the slack thin: at 1260 a ~1200px window was forced onto
// two rows even though the pair fit. The 24px logo variant always fits and opts out.
//
// Slot heights are per variant too: the search input is `h-full` and needs a definite parent
// (`h-14`); the safe bar wraps internally at narrow widths, so it gets `min-h-14` — against a fixed
// 56px slot the overflow spilled upwards into the actions card.
export const SEARCH_CONTEXT_HEIGHT = 'h-14'
export const SAFE_BAR_CONTEXT_HEIGHT = 'min-h-14'
export const SEARCH_CONTEXT_WRAP = '@max-[660px]:order-last @max-[660px]:basis-full'
export const SEARCH_ACTIONS_WRAP = '@max-[660px]:ml-0'
export const SAFE_BAR_CONTEXT_WRAP = '@max-[1150px]:order-last @max-[1150px]:basis-full'
export const SAFE_BAR_ACTIONS_WRAP = '@max-[1150px]:ml-0'

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

  // Which wrap threshold and slot height apply follow the context variant — see the constants above.
  const contextWrap = showLogo ? undefined : showSpaceSafeBar ? SAFE_BAR_CONTEXT_WRAP : SEARCH_CONTEXT_WRAP
  const actionsWrap = showLogo ? undefined : showSpaceSafeBar ? SAFE_BAR_ACTIONS_WRAP : SEARCH_ACTIONS_WRAP
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
          // The logo row is short, so center it against the taller actions card. The wide
          // variants keep their own top alignment.
          showLogo ? 'items-center' : 'items-start',
          showMenuButton && 'pl-2',
        )}
      >
        {/* First in the DOM and never reordered, so it holds the top-left corner at every width: the
            context is what moves (`order-last`) when the two groups stack, leaving the burger up here
            beside the account card. */}
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

        {/* Left content (context): the safe selector must not shrink so its children stay on one
            line. See the *_CONTEXT_WRAP / *_CONTEXT_HEIGHT constants for how each wide variant wraps
            and how tall its slot is. */}
        <div className={cn('shrink-0 flex items-center', contextHeight, contextWrap)}>
          {showLogo ? (
            <SafeLogo />
          ) : showSpaceSafeBar ? (
            <SpaceSafeBar />
          ) : (
            <GlobalSearchInput className="h-full w-64 rounded-3xl md:w-80" />
          )}
        </div>

        {/* Right content (actions): ml-auto pushes it to the right page padding. One 56px card
            holding the muted action chips, matching the safe-selector pill. See the *_ACTIONS_WRAP constants
            for how it gives that up when the wide context variants wrap below it.

            `flex-wrap min-w-0` and no `shrink-0`: the chips add up to ~403px, so on a 375px screen the
            cluster ran 36px past the header. `shrink-0` was why — it stopped the card ever narrowing
            enough for the chips to wrap, so they just spilled. Letting it shrink means they reflow
            onto a second row inside the card instead. */}
        <div
          className={cn(
            'flex min-w-0 flex-wrap items-center gap-1 ml-auto rounded-xl bg-card p-2 shadow-[0px_4px_20px_0px_rgba(0,0,0,0.03)]',
            actionsWrap,
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
