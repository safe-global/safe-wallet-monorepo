import { useCallback, useState } from 'react'
import { useAppSelector } from '@/store'
import { selectOverrideCount } from '@/features/feature-flag-overrides/store'
import { FeatureFlagEditorDialogLoader } from '@/features/feature-flag-overrides/FeatureFlagEditorDialogLoader'
import type { SidebarDeveloperItemState } from '../types'

/** Badges the active feature-flag overrides and opens the editor dialog. */
export const useFeatureFlagsItem = (): SidebarDeveloperItemState => {
  const [isOpen, setOpen] = useState(false)
  const overrideCount = useAppSelector(selectOverrideCount)
  const onSelect = useCallback(() => setOpen(true), [])

  return {
    badge: overrideCount > 0 ? overrideCount : undefined,
    onSelect,
    dialog: <FeatureFlagEditorDialogLoader open={isOpen} onOpenChange={setOpen} />,
  }
}
