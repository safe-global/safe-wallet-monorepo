import type { ReactElement } from 'react'
import { motion } from 'motion/react'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import css from '../../styles.module.css'
import { sidebarDeveloperGroup } from '../../developerItems'
import { SidebarDeveloperItem } from './SidebarDeveloperItem'
import { itemVariants } from '../../constants'

interface SidebarDeveloperGroupProps {
  isLoading?: boolean
}

/**
 * The dev-only Developer group, rendered identically by both sidebar variants. It owns the production
 * guard so no caller can leak the group, and each entry resolves its own state.
 */
export const SidebarDeveloperGroup = ({ isLoading = false }: SidebarDeveloperGroupProps): ReactElement | null => {
  if (process.env.NEXT_PUBLIC_IS_PRODUCTION === 'true') return null
  if (!sidebarDeveloperGroup.items.length) return null

  return (
    <motion.div variants={itemVariants}>
      <SidebarGroup className={css.sidebarGroup}>
        <SidebarGroupLabel>{sidebarDeveloperGroup.label}</SidebarGroupLabel>
        <SidebarSeparator className={css.collapsedSeparator} />
        <SidebarGroupContent>
          <SidebarMenu className="gap-0">
            {sidebarDeveloperGroup.items.map((config) => (
              <SidebarDeveloperItem key={config.id} config={config} isLoading={isLoading} />
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </motion.div>
  )
}
