import { type ReactElement, type ReactNode } from 'react'
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

export type SafeSidebarVariantViewProps = {
  /** Set when the workspace header group is shown. */
  workspaceHeader?: ReactNode
  actionButton: ReactNode
  mainNavItems: ReactNode
  /** Set when the DeFi group has items. */
  defiGroup?: { label: string; items: ReactNode }
  developerGroup: ReactNode
}

export const SafeSidebarVariantView = ({
  workspaceHeader,
  actionButton,
  mainNavItems,
  defiGroup,
  developerGroup,
}: SafeSidebarVariantViewProps): ReactElement => (
  <SidebarContent>
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {workspaceHeader && (
        <motion.div variants={itemVariants} className="mb-4">
          <SidebarGroup className={css.sidebarGroup}>
            <SidebarMenu>
              <SidebarMenuItem>{workspaceHeader}</SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </motion.div>
      )}

      {/* Action Button */}
      <motion.div variants={itemVariants} className="mb-4">
        <SidebarGroup className={css.sidebarGroup}>
          <SidebarGroupContent>{actionButton}</SidebarGroupContent>
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

      {/* DeFi Group */}
      {defiGroup && (
        <motion.div variants={itemVariants}>
          <SidebarGroup className={css.sidebarGroup}>
            <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">{defiGroup.label}</SidebarGroupLabel>
            <SidebarSeparator className={css.collapsedSeparator} />
            <SidebarGroupContent>
              <SidebarMenu className="gap-0">{defiGroup.items}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </motion.div>
      )}

      {developerGroup}
    </motion.div>
  </SidebarContent>
)
