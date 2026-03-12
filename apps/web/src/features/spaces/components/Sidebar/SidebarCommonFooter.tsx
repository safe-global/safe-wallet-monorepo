import type { ReactElement } from 'react'
import { SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar'
import { cn } from '@/utils/cn'
import { icons } from './config'
import css from './styles.module.css'
import { IS_PRODUCTION } from '@/config/constants'
import { Switch } from '@/components/ui/switch'
import { Field, FieldLabel } from '@/components/ui/field'
import { setDarkMode } from '@/store/settingsSlice'
import { useDarkMode } from '@/hooks/useDarkMode'
import { useAppDispatch } from '@/store'
import { ApiCtaSidebar } from './ApiCtaSidebar'

const HELP_URL = 'https://help.safe.global/en/'

export const SidebarCommonFooter = (): ReactElement => {
  const dispatch = useAppDispatch()
  const isDarkMode = useDarkMode()

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
        </div>
      )}

      {/* API CTA */}
      <ApiCtaSidebar />

      {/* Help Button */}
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            className={cn(css.sidebarInteractive, css.footerHelp)}
            render={<a href={HELP_URL} target="_blank" rel="noopener noreferrer" />}
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
