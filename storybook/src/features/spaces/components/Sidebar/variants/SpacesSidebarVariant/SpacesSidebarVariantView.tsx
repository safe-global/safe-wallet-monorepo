import type { ReactElement, ReactNode } from 'react'
import { motion } from 'motion/react'
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import css from '@/features/spaces/components/Sidebar/styles.module.css'
import { containerVariants, itemVariants } from '@views/features/spaces/components/Sidebar/constants'

export type SpacesSidebarVariantViewProps = {
  spaceSelector: ReactNode
  mainNavItems: ReactNode
  setupGroupLabel: string
  setupItems: ReactNode
  developerGroup: ReactNode
}

export const SpacesSidebarVariantView = ({
  spaceSelector,
  mainNavItems,
  setupGroupLabel,
  setupItems,
  developerGroup,
}: SpacesSidebarVariantViewProps): ReactElement => (
  <SidebarContent>
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} className="mb-6 group-data-[collapsible=icon]:mb-4">
        <SidebarGroup className={css.sidebarGroup}>
          <SidebarMenu>
            <SidebarMenuItem>{spaceSelector}</SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </motion.div>

      {/* Main Navigation */}
      <motion.div variants={itemVariants}>
        <SidebarGroup className={css.sidebarGroup}>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">{mainNavItems}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </motion.div>

      {/* Setup Group */}
      <motion.div variants={itemVariants}>
        <SidebarGroup className={css.sidebarGroup}>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">{setupGroupLabel}</SidebarGroupLabel>
          <SidebarSeparator className={css.collapsedSeparator} />
          <SidebarGroupContent>
            <SidebarMenu className="gap-0">{setupItems}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </motion.div>

      {developerGroup}
    </motion.div>
  </SidebarContent>
)
