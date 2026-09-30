import { FlaskConical } from 'lucide-react'
import type { SidebarDeveloperGroupConfig } from '../types'
import { useFeatureFlagsItem } from './useFeatureFlagsItem'

/**
 * Dev-only entries that run an action instead of navigating. Each one names the hook resolving its own
 * badge, action and dialog, so adding an entry means adding a line here plus its hook — nothing
 * downstream branches on which entry it is.
 *
 * This lives beside the entry hooks rather than in `config/` so the sidebar config stays declarative
 * and free of runtime dependencies.
 */
export const sidebarDeveloperGroup: SidebarDeveloperGroupConfig = {
  label: 'Developer',
  items: [
    {
      icon: FlaskConical,
      label: 'Feature flags',
      id: 'feature-flags',
      useItemState: useFeatureFlagsItem,
    },
  ],
}
