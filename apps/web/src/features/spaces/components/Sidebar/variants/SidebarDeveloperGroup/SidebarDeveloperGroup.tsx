import type { ReactElement } from 'react'
import { sidebarDeveloperGroup } from '../../developerItems'
import { SidebarDeveloperItem } from './SidebarDeveloperItem'
import { SidebarDeveloperGroupView } from '@views/features/spaces/components/Sidebar/variants/SidebarDeveloperGroup/SidebarDeveloperGroupView'

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
    <SidebarDeveloperGroupView
      label={sidebarDeveloperGroup.label}
      items={sidebarDeveloperGroup.items.map((config) => (
        <SidebarDeveloperItem key={config.id} config={config} isLoading={isLoading} />
      ))}
    />
  )
}
