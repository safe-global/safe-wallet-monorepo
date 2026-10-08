import type { Dispatch, SetStateAction } from 'react'
import { useContext, useMemo, useRef, type ReactElement } from 'react'
import { usePathname } from 'next/navigation'
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
import { useCurrentSpaceId } from '@/features/spaces'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import SafeLogo from '@/components/common/SafeLogo'
import SpaceSafeBar from '@/components/common/SpaceSafeBar'
import SafenetStakingButton from './SafenetStakingButton'
import { useSafeTokenEnabled } from '@/hooks/useSafeTokenEnabled'
import { TxModalContext } from '@/components/tx-flow'
import { TopbarView } from '@views/components/common/Header/Topbar/TopbarView'

export {
  SEARCH_CONTEXT_HEIGHT,
  SAFE_BAR_CONTEXT_HEIGHT,
  SEARCH_CONTEXT_WRAP,
  SAFE_BAR_CONTEXT_WRAP,
} from '@views/components/common/Header/Topbar/TopbarView'

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
      <TopbarView
        showLogo={showLogo}
        showSpaceSafeBar={showSpaceSafeBar}
        showMenuButton={showMenuButton}
        onMenuClick={() => onMenuToggle?.((open) => !open)}
        logo={<SafeLogo />}
        safeBar={<SpaceSafeBar />}
        SearchInput={GlobalSearchInput}
        safenetStaking={showSafeToken && <SafenetStakingButton />}
        navigation={
          <HeaderNavigation
            walletAddress={wallet?.address ?? ''}
            walletEns={walletName}
            isConnected={Boolean(wallet)}
            walletIcon={wallet?.icon}
            walletLabel={wallet?.label}
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
        }
        accountInfo={<HeaderAccountInfo />}
      />

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
