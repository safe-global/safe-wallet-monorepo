import type { ReactElement } from 'react'
import { useRouter } from 'next/router'
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { icons } from '../config'
import css from '../styles.module.css'
import type { SafeSidebarVariantProps } from '../types'
import { useCurrentSpaceId } from '@/features/spaces/hooks/useCurrentSpaceId'
import { AppRoutes } from '@/config/routes'
import { NavItem } from './NavItem'

const getSpaceInitial = (name: string | undefined, initial: string | undefined): string =>
  initial ?? (name?.charAt(0) ?? '').toUpperCase()

export const SafeSidebarVariant = ({
  spaceName = '',
  spaceInitial,
  mainNavItems,
  defiGroup,
}: SafeSidebarVariantProps): ReactElement => {
  const initial = getSpaceInitial(spaceName, spaceInitial)
  const spaceId = useCurrentSpaceId()
  const router = useRouter()

  const handleBackToSpace = () => {
    if (spaceId) {
      router.push({
        pathname: AppRoutes.spaces.index,
        query: { spaceId },
      })
    }
  }

  return (
    <SidebarContent className={css.sidebarContent}>
      {spaceId && (
        <SidebarGroup className={css.sidebarGroup}>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                tooltip="Back to Space"
                className={css.backToSpace}
                onClick={handleBackToSpace}
              >
                <icons.ChevronLeft className={`size-4 shrink-0 ${css.backToSpaceChevron}`} />
                <Avatar className={css.spaceSelectorAvatar}>
                  <AvatarFallback className={css.spaceSelectorAvatarFallback}>{initial}</AvatarFallback>
                </Avatar>
                <div className={css.spaceSelectorText}>
                  <span className={css.spaceSelectorName}>{spaceName}</span>
                  <span className={css.spaceSelectorSubtitle}>Space</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      )}

      {/* Main Navigation */}
      <SidebarGroup className={css.sidebarGroup}>
        <SidebarGroupContent>
          <SidebarMenu className="gap-0">
            {mainNavItems.map((item) => (
              <NavItem key={item.href} item={item} />
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* DeFi Group - only show if has items */}
      {defiGroup.items.length > 0 && (
        <SidebarGroup className={css.sidebarGroup}>
          <SidebarGroupLabel>{defiGroup.label}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0">
              {defiGroup.items.map((item) => (
                <NavItem key={item.href} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}
    </SidebarContent>
  )
}
