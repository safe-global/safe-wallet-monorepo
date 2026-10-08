import type { ReactElement, ReactNode } from 'react'
import { motion } from 'motion/react'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import css from '@/features/spaces/components/Sidebar/styles.module.css'
import { itemVariants } from '@views/features/spaces/components/Sidebar/constants'

export type SidebarDeveloperGroupViewProps = {
  label: string
  items: ReactNode
}

export const SidebarDeveloperGroupView = ({ label, items }: SidebarDeveloperGroupViewProps): ReactElement => (
  <motion.div variants={itemVariants}>
    <SidebarGroup className={css.sidebarGroup}>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarSeparator className={css.collapsedSeparator} />
      <SidebarGroupContent>
        <SidebarMenu className="gap-0">{items}</SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  </motion.div>
)
