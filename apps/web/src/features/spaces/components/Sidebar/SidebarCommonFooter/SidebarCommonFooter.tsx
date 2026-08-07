import { useState, useCallback, type ReactElement } from 'react'
import { Sparkles } from 'lucide-react'
import { SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar'
import { cn } from '@/utils/cn'
import { icons } from '../config'
import css from '../styles.module.css'
import { IS_PRODUCTION } from '@/config/constants'
import { trackEvent, OVERVIEW_EVENTS, MixpanelEventParams } from '@/services/analytics'
import { Switch } from '@/components/ui/switch'
import { Field, FieldLabel } from '@/components/ui/field'
import { setDarkMode } from '@/store/settingsSlice'
import { useDarkMode } from '@/hooks/useDarkMode'
import { useAppDispatch, useAppSelector } from '@/store'
import { CookieAndTermType, hasConsentFor } from '@/store/cookiesAndTermsSlice'
import { openCookieBanner } from '@/store/popupSlice'
import { BEAMER_SELECTOR } from '@/services/beamer'
import { ApiCtaSidebar } from '../ApiCtaSidebar'
import { SidebarIndexingStatus } from '../SidebarIndexingStatus'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { LS_KEY } from '@/config/gateway'
import HelpMenu from '@/components/common/HelpMenu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export const SidebarCommonFooter = ({ isSafeSidebar = false }: { isSafeSidebar?: boolean }): ReactElement => {
  const dispatch = useAppDispatch()
  const hasBeamerConsent = useAppSelector((state) => hasConsentFor(state, CookieAndTermType.UPDATES))
  const isDarkMode = useDarkMode()
  const [isProdGateway = false, setIsProdGateway] = useLocalStorage<boolean>(LS_KEY)
  const [helpMenuAnchor, setHelpMenuAnchor] = useState<HTMLElement | null>(null)

  const onToggleGateway = (checked: boolean) => {
    setIsProdGateway(checked)
    setTimeout(() => location.reload(), 300)
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
        <ApiCtaSidebar />

        <SidebarMenuItem className={css.footerHelpRow}>
          <SidebarMenuButton
            className={cn('h-9 min-w-0 flex-1 gap-3', css.sidebarInteractive, css.sidebarNavItem)}
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
          <Tooltip>
            <TooltipTrigger
              render={
                <SidebarMenuButton
                  type="button"
                  id={BEAMER_SELECTOR}
                  data-testid="list-item-whats-new"
                  aria-label="What's new"
                  className={cn(
                    'h-9 w-9 min-w-9 shrink-0 gap-0 !px-0 !py-0 text-center !justify-center !overflow-visible',
                    '[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:stroke-[1.25]',
                    css.sidebarInteractive,
                    css.footerBeamerButton,
                  )}
                  onClick={handleBeamerClick}
                />
              }
            >
              <Sparkles aria-hidden strokeWidth={1.25} />
            </TooltipTrigger>
            <TooltipContent side="top">What&apos;s new</TooltipContent>
          </Tooltip>
          <div className={css.footerHelpStatus}>
            <SidebarIndexingStatus isSafeSidebar={isSafeSidebar} />
          </div>
        </SidebarMenuItem>
      </SidebarMenu>

      <HelpMenu anchorEl={helpMenuAnchor} onClose={handleHelpMenuClose} />
    </SidebarFooter>
  )
}
