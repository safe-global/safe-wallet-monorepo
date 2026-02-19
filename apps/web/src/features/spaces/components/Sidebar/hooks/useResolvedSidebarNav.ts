import { useRouter } from 'next/router'
import type { SidebarItemConfig, SidebarGroupConfig, ResolvedSidebarItem, ResolvedSidebarGroup } from '../types'

interface NavResolverOptions {
  getLink: (item: SidebarItemConfig) => ResolvedSidebarItem['link']
  isItemDisabled?: (item: SidebarItemConfig) => boolean
}

const resolveItem = (
  item: SidebarItemConfig,
  pathname: string,
  options: NavResolverOptions,
): ResolvedSidebarItem => ({
  icon: item.icon,
  label: item.label,
  href: item.href,
  badge: item.badge,
  isActive: pathname === item.href,
  disabled: options.isItemDisabled?.(item) ?? false,
  link: options.getLink(item),
})

export const useResolvedSidebarNav = (
  mainNavConfig: SidebarItemConfig[],
  setupGroupConfig: SidebarGroupConfig,
  options: NavResolverOptions,
): { mainNavItems: ResolvedSidebarItem[]; setupGroup: ResolvedSidebarGroup } => {
  const { pathname } = useRouter()

  return {
    mainNavItems: mainNavConfig.map((item) => resolveItem(item, pathname, options)),
    setupGroup: {
      label: setupGroupConfig.label,
      items: setupGroupConfig.items.map((item) => resolveItem(item, pathname, options)),
    },
  }
}
