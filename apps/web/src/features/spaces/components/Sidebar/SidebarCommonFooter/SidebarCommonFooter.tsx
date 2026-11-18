import { useState, useCallback, type ReactElement } from 'react'
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@safe-global/views/components/ui/sidebar'
import { cn } from '@safe-global/views/utils/cn'
import { icons } from '../config'
import css from '../styles.module.css'
import { IS_PRODUCTION } from '@/config/constants'
import { OVERVIEW_EVENTS } from '@/services/analytics/events/overview'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import Track from '@/components/common/Track'
import { Switch } from '@safe-global/views/components/ui/switch'
import { Field, FieldLabel } from '@safe-global/views/components/ui/field'
import { setDarkMode } from '@/store/settingsSlice'
import { useDarkMode } from '@/hooks/useDarkMode'
import { useAppDispatch } from '@/store'
import { ApiCtaSidebar } from '../ApiCtaSidebar/ApiCtaSidebar'
import { WhatsNewButton } from '../WhatsNewButton/WhatsNewButton'
import { useIsSafeProAnnouncementEnabled } from '@/features/safe-pro-announcement/public/hooks/useIsSafeProAnnouncementEnabled'
import { useSafeProSidebarBannerDismissed } from '@/features/safe-pro-announcement/public/hooks/useSafeProSidebarBannerDismissed'
import { SidebarIndexingStatus } from '../SidebarIndexingStatus/SidebarIndexingStatus'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { LS_KEY } from '@/config/gateway'
import HelpMenu from '@/components/common/HelpMenu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useHasFeature } from '@/hooks/useChains'
import { useIsSafeProEnabled } from '@/hooks/useIsSafeProEnabled'
import { useTwoFactorAwarenessDismissed } from '@/features/oidc-auth/public/hooks/useTwoFactorAwarenessDismissed'
import { useCurrentSpaceId } from '../../../public/hooks/useCurrentSpaceId'
import { reloadPage } from '@/utils/navigation'
import WorkspaceTwoFactorAwarenessCard from '@/features/oidc-auth/public/components/WorkspaceTwoFactorAwarenessCard'
import SafeProSidebarBanner from '@/features/safe-pro-announcement/public/components/SafeProSidebarBanner'

export const SidebarCommonFooter = ({ isSafeSidebar = false }: { isSafeSidebar?: boolean }): ReactElement => {
  const dispatch = useAppDispatch()
  const isDarkMode = useDarkMode()
  const [isProdGateway = false, setIsProdGateway] = useLocalStorage<boolean>(LS_KEY)
  const [helpMenuAnchor, setHelpMenuAnchor] = useState<HTMLElement | null>(null)
  const isSafeProAnnouncementEnabled = useIsSafeProAnnouncementEnabled()
  const isSafePro = useIsSafeProEnabled()
  const { pathname } = useRouter()
  const [isSafeProBannerDismissed, dismissSafeProBanner] = useSafeProSidebarBannerDismissed()
  // Its copy is pre-launch only, so it retires once Safe Pro is live.
  const hasSafeProBanner = isSafeProAnnouncementEnabled && !isSafePro && pathname !== AppRoutes.spaces.plans
  const showSafeProBanner = hasSafeProBanner && !isSafeProBannerDismissed

  const spaceId = useCurrentSpaceId()
  // Own flag, separate from the 2FA feature itself, so the card can be switched off on its own.
  const isTwoFactorBannerFlagOn = useHasFeature(FEATURES.TWO_FACTOR_AWARENESS_BANNER) === true
  const isOidcAuthEnabled = useHasFeature(FEATURES.OIDC_AUTH) === true
  const isTwoFactorCardEnabled = isTwoFactorBannerFlagOn && isOidcAuthEnabled
  const [isTwoFactorCardDismissed, dismissTwoFactorCard] = useTwoFactorAwarenessDismissed()
  // Continue needs a Workspace to link to, so the card waits until one is known.
  const hasTwoFactorCard =
    isTwoFactorCardEnabled &&
    !isTwoFactorCardDismissed &&
    spaceId !== null &&
    pathname !== AppRoutes.spaces.settingsGeneral
  // One slot, Safe Pro first: the 2FA card only takes it once the Safe Pro banner is gone.
  const showTwoFactorCard = hasTwoFactorCard && !showSafeProBanner

  const onToggleGateway = (checked: boolean) => {
    setIsProdGateway(checked)
    setTimeout(reloadPage, 300)
  }

  const handleHelpClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setHelpMenuAnchor(event.currentTarget)
  }, [])

  const handleHelpMenuClose = useCallback(() => {
    setHelpMenuAnchor(null)
  }, [])

  return (
    <SidebarFooter data-testid="sidebar-common-footer">
      {/* Dev Toggles - only in non-production */}
      {!IS_PRODUCTION && (
        <div className="flex flex-col gap-2 px-3 py-2 group-data-[collapsible=icon]:hidden">
          <Field orientation="horizontal">
            <Switch
              id="dark-mode-toggle"
              checked={isDarkMode}
              onCheckedChange={(checked) => dispatch(setDarkMode(checked))}
            />
            <FieldLabel htmlFor="dark-mode-toggle">Dark mode</FieldLabel>
          </Field>
          {isSafeSidebar && (
            <Field orientation="horizontal">
              <Switch id="prod-cgw-toggle" checked={isProdGateway} onCheckedChange={onToggleGateway} />
              <FieldLabel htmlFor="prod-cgw-toggle">Use prod CGW</FieldLabel>
            </Field>
          )}
        </div>
      )}

      <SidebarMenu className="gap-0.5">
        {(showSafeProBanner || showTwoFactorCard) && (
          <SidebarMenuItem className="group-data-[collapsible=icon]:hidden">
            {/* One grid cell for both, so nothing below moves when one gives way to the other. */}
            <div className="mb-2 grid">
              {hasSafeProBanner && (
                <SafeProSidebarBanner
                  className={cn('col-start-1 row-start-1', !showSafeProBanner && 'invisible')}
                  isShown={showSafeProBanner}
                  onDismiss={dismissSafeProBanner}
                />
              )}
              {hasTwoFactorCard && (
                <WorkspaceTwoFactorAwarenessCard
                  className={cn('col-start-1 row-start-1', !showTwoFactorCard && 'invisible')}
                  spaceId={spaceId ?? undefined}
                  onDismiss={dismissTwoFactorCard}
                />
              )}
            </div>
          </SidebarMenuItem>
        )}

        <ApiCtaSidebar />

        <SidebarMenuItem
          className={cn(
            css.footerHelpRow,
            'group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-0.5',
          )}
        >
          <Track
            {...OVERVIEW_EVENTS.HELP_CENTER}
            mixpanelParams={{ [MixpanelEventParams.SIDEBAR_ELEMENT]: 'Help Center' }}
          >
            <SidebarMenuButton
              className={cn(
                'h-9 min-w-0 flex-1 gap-3 group-data-[collapsible=icon]:flex-none',
                css.sidebarInteractive,
                css.sidebarNavItem,
              )}
              data-testid="list-item-need-help"
              onClick={handleHelpClick}
            >
              <Tooltip>
                <TooltipTrigger render={<div />} className="flex min-w-0 cursor-pointer items-center gap-3">
                  <icons.CircleHelp />
                  <span className="truncate group-data-[collapsible=icon]:hidden">Help</span>
                </TooltipTrigger>
                <TooltipContent side="right">Help center</TooltipContent>
              </Tooltip>
            </SidebarMenuButton>
          </Track>
          <WhatsNewButton />
          <div className={css.footerHelpStatus}>
            <SidebarIndexingStatus isSafeSidebar={isSafeSidebar} />
          </div>
        </SidebarMenuItem>
      </SidebarMenu>

      <HelpMenu anchorEl={helpMenuAnchor} onClose={handleHelpMenuClose} />
    </SidebarFooter>
  )
}
