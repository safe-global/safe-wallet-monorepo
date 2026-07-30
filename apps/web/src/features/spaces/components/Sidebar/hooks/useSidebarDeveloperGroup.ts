import { useCallback, useMemo, useState } from 'react'
import { sidebarDeveloperGroup, FEATURE_FLAGS_ITEM_ID } from '../config'
import type { ResolvedSidebarActionGroup } from '../types'
import { useAppSelector } from '@/store'
import { selectOverrideCount } from '@/features/feature-flag-overrides/store'

interface SidebarDeveloperGroupState {
  /** `undefined` in production, where the group and its editor must not exist at all. */
  developerGroup: ResolvedSidebarActionGroup | undefined
  isEditorOpen: boolean
  setEditorOpen: (open: boolean) => void
}

/**
 * Resolves the dev-only Developer group shared by both sidebar variants, along with the open state
 * of the feature-flag editor its entry opens.
 */
export const useSidebarDeveloperGroup = (): SidebarDeveloperGroupState => {
  const [isEditorOpen, setEditorOpen] = useState(false)

  // Called unconditionally to respect the rules of hooks; it's trivial in production.
  const overrideCount = useAppSelector(selectOverrideCount)

  const openEditor = useCallback(() => setEditorOpen(true), [])

  const developerGroup = useMemo(() => {
    if (process.env.NEXT_PUBLIC_IS_PRODUCTION === 'true') return undefined

    return {
      label: sidebarDeveloperGroup.label,
      items: sidebarDeveloperGroup.items.map((item) => ({
        icon: item.icon,
        label: item.label,
        id: item.id,
        badge: item.id === FEATURE_FLAGS_ITEM_ID && overrideCount > 0 ? overrideCount : undefined,
        isActive: false,
        disabled: false,
        testId: `sidebar-${item.id}-item`,
        onSelect: openEditor,
      })),
    }
  }, [overrideCount, openEditor])

  return { developerGroup, isEditorOpen, setEditorOpen }
}
