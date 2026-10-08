import { useState, useCallback, type ReactElement } from 'react'
import { IS_PRODUCTION } from '@/config/constants'
import { trackEvent, OVERVIEW_EVENTS, MixpanelEventParams } from '@/services/analytics'
import { setDarkMode } from '@/store/settingsSlice'
import { useDarkMode } from '@/hooks/useDarkMode'
import { useAppDispatch, useAppSelector } from '@/store'
import { CookieAndTermType, hasConsentFor } from '@/store/cookiesAndTermsSlice'
import { openCookieBanner } from '@/store/popupSlice'
import { BEAMER_SELECTOR } from '@/services/beamer'
import { ApiCtaSidebar } from '../ApiCtaSidebar'
import {
  SafeProFeature,
  useIsSafeProAnnouncementEnabled,
  useSafeProSidebarBannerDismissed,
} from '@/features/safe-pro-announcement'
import { useLoadFeature } from '@/features/__core__'
import { SidebarIndexingStatus } from '../SidebarIndexingStatus'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { LS_KEY } from '@/config/gateway'
import HelpMenu from '@/components/common/HelpMenu'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useHasFeature } from '@/hooks/useChains'
import { useIsSafeProEnabled } from '@/hooks/useIsSafeProEnabled'
import { OidcAuthFeature, useTwoFactorAwarenessDismissed } from '@/features/oidc-auth'
import { useCurrentSpaceId } from '../../../hooks/useCurrentSpaceId'
import { reloadPage } from '@/utils/navigation'
import { SidebarCommonFooterView } from '@views/features/spaces/components/Sidebar/SidebarCommonFooter/SidebarCommonFooterView'

export const SidebarCommonFooter = ({ isSafeSidebar = false }: { isSafeSidebar?: boolean }): ReactElement => {
  const dispatch = useAppDispatch()
  const hasBeamerConsent = useAppSelector((state) => hasConsentFor(state, CookieAndTermType.UPDATES))
  const isDarkMode = useDarkMode()
  const [isProdGateway = false, setIsProdGateway] = useLocalStorage<boolean>(LS_KEY)
  const [helpMenuAnchor, setHelpMenuAnchor] = useState<HTMLElement | null>(null)
  const { SafeProSidebarBanner, $isReady: isSafeProLoaded, $error: safeProError } = useLoadFeature(SafeProFeature)
  const {
    WorkspaceTwoFactorAwarenessCard,
    $isReady: isTwoFactorCardLoaded,
    $error: twoFactorCardError,
  } = useLoadFeature(OidcAuthFeature)
  const isSafeProAnnouncementEnabled = useIsSafeProAnnouncementEnabled()
  const isSafePro = useIsSafeProEnabled()
  const { pathname } = useRouter()
  const [isSafeProBannerDismissed, dismissSafeProBanner] = useSafeProSidebarBannerDismissed()
  // A failed chunk counts as no banner: its stub then renders nothing for good.
  // Its copy is pre-launch only, so it retires once Safe Pro is live.
  const hasSafeProBanner =
    isSafeProAnnouncementEnabled && !isSafePro && pathname !== AppRoutes.spaces.plans && !safeProError
  const showSafeProBanner = hasSafeProBanner && !isSafeProBannerDismissed

  const spaceId = useCurrentSpaceId()
  // Own flag, separate from the 2FA feature itself, so the card can be switched off on its own.
  const isTwoFactorCardEnabled = useHasFeature(FEATURES.TWO_FACTOR_AWARENESS_BANNER) === true
  const [isTwoFactorCardDismissed, dismissTwoFactorCard] = useTwoFactorAwarenessDismissed()
  // Continue needs a Workspace to link to, so the card waits until one is known.
  const hasTwoFactorCard =
    isTwoFactorCardEnabled &&
    !isTwoFactorCardDismissed &&
    !twoFactorCardError &&
    spaceId !== null &&
    pathname !== AppRoutes.spaces.settingsGeneral
  // One slot, Safe Pro first: the 2FA card only takes it once the Safe Pro banner is gone.
  const showTwoFactorCard = hasTwoFactorCard && !showSafeProBanner
  // Both are lazy: their stubs render nothing, so opening the slot early leaves an empty box.
  const isBannerPending = (showSafeProBanner && !isSafeProLoaded) || (showTwoFactorCard && !isTwoFactorCardLoaded)

  const onToggleGateway = (checked: boolean) => {
    setIsProdGateway(checked)
    setTimeout(reloadPage, 300)
  }

  const handleHelpClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    trackEvent({ ...OVERVIEW_EVENTS.HELP_CENTER }, { [MixpanelEventParams.SIDEBAR_ELEMENT]: 'Help Center' })
    setHelpMenuAnchor(event.currentTarget)
  }, [])

  const handleHelpMenuClose = useCallback(() => {
    setHelpMenuAnchor(null)
  }, [])

  const handleBeamerClick = useCallback(() => {
    trackEvent({ ...OVERVIEW_EVENTS.WHATS_NEW }, { [MixpanelEventParams.SIDEBAR_ELEMENT]: "What's New" })
    if (!hasBeamerConsent) {
      dispatch(openCookieBanner({ warningKey: CookieAndTermType.UPDATES }))
    }
  }, [dispatch, hasBeamerConsent])

  return (
    <SidebarCommonFooterView
      isSafeSidebar={isSafeSidebar}
      showDevToggles={!IS_PRODUCTION}
      isDarkMode={isDarkMode}
      onDarkModeChange={(checked) => dispatch(setDarkMode(checked))}
      isProdGateway={isProdGateway}
      onToggleGateway={onToggleGateway}
      showBannerSlot={!isBannerPending && (showSafeProBanner || showTwoFactorCard)}
      showSafeProBanner={showSafeProBanner}
      showTwoFactorCard={showTwoFactorCard}
      renderSafeProBanner={
        hasSafeProBanner
          ? (props) => <SafeProSidebarBanner {...props} isShown={showSafeProBanner} onDismiss={dismissSafeProBanner} />
          : undefined
      }
      renderTwoFactorCard={
        hasTwoFactorCard
          ? (props) => (
              <WorkspaceTwoFactorAwarenessCard
                {...props}
                spaceId={spaceId ?? undefined}
                onDismiss={dismissTwoFactorCard}
              />
            )
          : undefined
      }
      apiCta={<ApiCtaSidebar />}
      onHelpClick={handleHelpClick}
      beamerId={BEAMER_SELECTOR}
      onBeamerClick={handleBeamerClick}
      indexingStatus={<SidebarIndexingStatus isSafeSidebar={isSafeSidebar} />}
      helpMenu={<HelpMenu anchorEl={helpMenuAnchor} onClose={handleHelpMenuClose} />}
    />
  )
}
