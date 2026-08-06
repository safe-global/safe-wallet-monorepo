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

// The context and the actions card share one row until they genuinely stop fitting, then the actions
// take the top row and the context drops underneath. Where that happens depends on WHICH context is
// showing, so the threshold is per variant rather than shared — the two differ by ~335px, and one
// threshold sized for the widest of them broke the narrowest ~600px early, stranding the search on
// its own row with most of the header empty.
//
// Measured, with the header's px-6 excluded because a container query on `inline-size` resolves
// against the content box (verified: a 1268px content box sits on one row under a 1260px rule, a
// 1218px one wraps). The actions card is not one width either — a Safe route carries more chips
// (batch, Safe token) than a space route:
//   space route  search 320 + actions 315 =  635  ->  break under 660
//   safe route   bar    655 + actions 479 = 1134  ->  break under 1260
// Keep the slack. Setting a threshold BELOW what the pair needs does not avoid the wrap, it just
// makes flexbox do it unprompted — and then `order-first` never applies, so the context lands on top
// and the account is no longer the fixed element. Measured that at a 1000px safe-route threshold.
//
// The account chrome is the fixed point of the header, so it does not move when they stack: it takes
// the top row and keeps the right-hand position it holds on one row, with the context dropping
// underneath it. `order-first` on the actions does the reordering, and leaving `ml-auto` in force
// (rather than an `ml-0`) is what keeps the card on the right instead of sliding to the left edge.
//
// Only the context slot gets `basis-full` — that alone consumes its line, which is what pushes the
// two apart. The actions must NOT repeat it: `flex-basis: 100%` sets a flex item's *width*, and
// unlike the invisible context slot the actions are a painted card, so it stretched across the whole
// row with its chips (~295px) marooned at the left of ~650px of empty white.
//
// No `justify-end` on the context either: it right-aligned the search inside its full-width slot,
// which put the rows on a diagonal back when the actions were pinned left. The search now starts on
// the page's left padding at every width.
//
// The logo variant is 24px and always fits beside the actions, so it opts out entirely. Named so the
// Topbar tests can assert which left-slot variant opts in without restating the utility list.
// The slot height is per variant too. The search input sizes itself with `h-full`, which needs a
// definite parent, so that variant is pinned to `h-14` (56px, matching the actions card). The safe
// bar must NOT be: it wraps internally at narrow widths (to 104px measured), and against a fixed
// 56px slot `items-center` centred the overflow — half of it spilling *upwards*, 24px into the
// actions card above. `min-h-14` keeps the 56px floor while letting it grow.
export const SEARCH_CONTEXT_HEIGHT = 'h-14'
export const SAFE_BAR_CONTEXT_HEIGHT = 'min-h-14'
export const SEARCH_CONTEXT_WRAP = '@max-[660px]:basis-full'
export const SEARCH_ACTIONS_WRAP = '@max-[660px]:order-first'
export const SAFE_BAR_CONTEXT_WRAP = '@max-[1260px]:basis-full'
export const SAFE_BAR_ACTIONS_WRAP = '@max-[1260px]:order-first'

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
        {/* Left content (context): the safe selector must not shrink so its children stay on one
            line. See the *_CONTEXT_WRAP / *_CONTEXT_HEIGHT constants for how each wide variant wraps
            and how tall its slot is.

            The burger lives in here rather than beside it: the wide variants are `basis-full`, so a
            sibling burger could never share their line and got stranded on a row of its own. */}
        <div className={cn('shrink-0 flex items-center gap-2', contextHeight, contextWrap)}>
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
