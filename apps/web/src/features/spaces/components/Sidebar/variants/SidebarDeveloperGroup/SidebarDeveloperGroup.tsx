import type { ReactElement } from 'react'
import { motion } from 'motion/react'
import { SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu } from '@/components/ui/sidebar'
import css from '../../styles.module.css'
import type { ResolvedSidebarActionGroup } from '../../types'
import { NavItem } from '../NavItem'
import { itemVariants } from '../../constants'

interface SidebarDeveloperGroupProps {
  group?: ResolvedSidebarActionGroup | null
  isLoading?: boolean
}

/** Renders the dev-only Developer group identically in both sidebar variants, or nothing at all. */
export const SidebarDeveloperGroup = ({
  group,
  isLoading = false,
}: SidebarDeveloperGroupProps): ReactElement | null => {
  if (!group?.items.length) return null

  return (
    <motion.div variants={itemVariants}>
      <SidebarGroup className={css.sidebarGroup}>
        <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu className="gap-0">
            {group.items.map((item) => (
              <NavItem key={item.id} item={item} isLoading={isLoading} />
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </motion.div>
  )
}
