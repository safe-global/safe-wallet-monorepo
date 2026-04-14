import type { ReactElement } from 'react'
import { motion } from 'motion/react'
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import css from '../../styles.module.css'
import type { SpaceSelectorProps, ResolvedSidebarItem, ResolvedSidebarGroup } from '../../types'
import { NavItem } from '../NavItem'
import { SpaceSelectorDropdown } from '../SpaceSelectorDropdown'
import { containerVariants, itemVariants } from '../../constants'

interface SpacesSidebarVariantProps extends SpaceSelectorProps {
  mainNavItems: ResolvedSidebarItem[]
  setupGroup: ResolvedSidebarGroup
}

export const SpacesSidebarVariant = ({
  selectedSpace,
  spaces,
  mainNavItems,
  setupGroup,
}: SpacesSidebarVariantProps): ReactElement => {
  return (
    <SidebarContent>
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={itemVariants}>
          <SidebarGroup className={css.sidebarGroup}>
            <SidebarMenu>
              <SidebarMenuItem>
                <SpaceSelectorDropdown selectedSpace={selectedSpace} spaces={spaces} />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </motion.div>

        {/* Main Navigation */}
        <motion.div variants={itemVariants}>
          <SidebarGroup className={css.sidebarGroup}>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0">
                {mainNavItems.map((item) => (
                  <NavItem key={item.href} item={item} isSpacesVariant />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </motion.div>

        {/* Setup Group */}
        <motion.div variants={itemVariants}>
          <SidebarGroup className={css.sidebarGroup}>
            <SidebarGroupLabel>{setupGroup.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0">
                {setupGroup.items.map((item) => (
                  <NavItem key={item.href} item={item} isSpacesVariant />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </motion.div>
      </motion.div>
    </SidebarContent>
  )
}
