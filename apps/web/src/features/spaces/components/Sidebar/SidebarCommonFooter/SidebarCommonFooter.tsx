import type { ReactElement } from 'react'
import { SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar'
import { cn } from '@/utils/cn'
import { icons } from '../config'
import css from '../styles.module.css'
import { IS_PRODUCTION } from '@/config/constants'
import { HELP_CENTER_URL } from '@safe-global/utils/config/constants'
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

export const SidebarCommonFooter = ({ isSafeSidebar = false }: { isSafeSidebar?: boolean }): ReactElement => {
  const dispatch = useAppDispatch()
  const isDarkMode = useDarkMode()
  const [isProdGateway = false, setIsProdGateway] = useLocalStorage<boolean>(LS_KEY)

  const onToggleGateway = (checked: boolean) => {
    setIsProdGateway(checked)
    setTimeout(() => location.reload(), 300)
  }

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

      <ApiCtaSidebar />

      {/* Help Button + Indexing Status */}
      <SidebarMenu>
        <SidebarMenuItem className={css.footerHelpRow}>
          <SidebarMenuButton
            size="lg"
            className={cn(css.sidebarInteractive, css.footerHelp, css.sidebarNavItem)}
            render={<a href={HELP_CENTER_URL} target="_blank" rel="noopener noreferrer" />}
            data-testid="list-item-need-help"
            onClick={() =>
              trackEvent({ ...OVERVIEW_EVENTS.HELP_CENTER }, { [MixpanelEventParams.SIDEBAR_ELEMENT]: 'Help Center' })
            }
          >
            <icons.CircleHelp />
            <span>Help</span>
          </SidebarMenuButton>
          <div className={css.footerHelpStatus}>
            <SidebarIndexingStatus />
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  )
}
