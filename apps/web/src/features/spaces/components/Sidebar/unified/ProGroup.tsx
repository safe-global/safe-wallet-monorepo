import type { ReactElement } from 'react'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarSeparator,
} from '@safe-global/views/components/ui/sidebar'
import css from '../styles.module.css'
import { ProNavItem } from './ProNavItem'
import { getProItem, PRO_GROUP_KEYS } from './proItems'
import type { Role } from './scenario'

type ProGroupProps = {
  hasPro: boolean
  role: Role
  safe: string | undefined
  safeName: string
  otherSafeName: string
}

/** Every Pro feature in one group after Defi, so the free items above stay exactly as they are. */
export const ProGroup = ({ hasPro, ...itemProps }: ProGroupProps): ReactElement => (
  <SidebarGroup className={css.sidebarGroup} data-testid="unified-pro-group">
    <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Safe Pro</SidebarGroupLabel>
    <SidebarSeparator className={css.collapsedSeparator} />
    <SidebarGroupContent>
      <SidebarMenu className="gap-0">
        {PRO_GROUP_KEYS.map((key) => {
          const item = getProItem(key)
          return item ? <ProNavItem key={key} item={item} isIncluded={hasPro} {...itemProps} /> : null
        })}
      </SidebarMenu>
    </SidebarGroupContent>
  </SidebarGroup>
)
