import type { ReactElement } from 'react'
import { SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar'
import { cn } from '@/utils/cn'
import { icons } from './config'
import css from './styles.module.css'
import { IS_PRODUCTION } from '@/config/constants'
import { HELP_CENTER_URL } from '@safe-global/utils/config/constants'
import { Switch } from '@/components/ui/switch'
import { Field, FieldLabel } from '@/components/ui/field'
import { setDarkMode } from '@/store/settingsSlice'
import { useDarkMode } from '@/hooks/useDarkMode'
import { useAppDispatch } from '@/store'
import { ApiCtaSidebar } from './ApiCtaSidebar'
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
    <SidebarFooter data-testid="sidebar-common-footer" className={css.sidebarFooter}>
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

      {/* Help Button */}
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            className={cn(css.sidebarInteractive, css.footerHelp, css.sidebarNavItem)}
            render={<a href={`${HELP_CENTER_URL}/en/`} target="_blank" rel="noopener noreferrer" />}
            data-testid="list-item-need-help"
          >
            <icons.CircleHelp />
            <span>Help</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  )
}
