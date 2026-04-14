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
  mainNavItems: ResolvedSidebarItem[] | null
  setupGroup: ResolvedSidebarGroup | null
  isLoading?: boolean
}

const SPACES_MAIN_NAV_SKELETON_COUNT = 3
const SPACES_SETUP_GROUP_SKELETON_COUNT = 2

export const SpacesSidebarVariant = ({
  selectedSpace,
  spaces,
  mainNavItems,
  setupGroup,
  isLoading = false,
}: SpacesSidebarVariantProps): ReactElement => {
  const displayMainNavItems = mainNavItems || Array(SPACES_MAIN_NAV_SKELETON_COUNT).fill(null)
  const displaySetupItems = setupGroup?.items || Array(SPACES_SETUP_GROUP_SKELETON_COUNT).fill(null)

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
                {displayMainNavItems.map((item, index) => (
                  <NavItem
                    key={item?.href ?? `skeleton-main-${index}`}
                    item={item}
                    isSpacesVariant
                    isLoading={isLoading}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </motion.div>

        {/* Setup Group */}
        <motion.div variants={itemVariants}>
          <SidebarGroup className={css.sidebarGroup}>
            <SidebarGroupLabel>{setupGroup?.label ?? ''}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0">
                {displaySetupItems.map((item, index) => (
                  <NavItem
                    key={item?.href ?? `skeleton-setup-${index}`}
                    item={item}
                    isSpacesVariant
                    isLoading={isLoading}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </motion.div>
      </motion.div>
    </SidebarContent>
  )
}
