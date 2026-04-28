import { useState, useCallback, type ReactElement } from 'react'
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
import { useAppDispatch } from '@/store'
import { ApiCtaSidebar } from '../ApiCtaSidebar'
import { SidebarIndexingStatus } from '../SidebarIndexingStatus'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { LS_KEY } from '@/config/gateway'
import HelpMenu from '@/components/common/HelpMenu'

export const SidebarCommonFooter = ({ isSafeSidebar = false }: { isSafeSidebar?: boolean }): ReactElement => {
  const dispatch = useAppDispatch()
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
            <icons.CircleHelp />
            <span>Help</span>
          </SidebarMenuButton>
          <div className={css.footerHelpStatus}>
            <SidebarIndexingStatus />
          </div>
        </SidebarMenuItem>
      </SidebarMenu>

      <HelpMenu anchorEl={helpMenuAnchor} onClose={handleHelpMenuClose} />
    </SidebarFooter>
  )
}
