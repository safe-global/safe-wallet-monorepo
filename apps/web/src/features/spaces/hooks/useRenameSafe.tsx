import { useCallback, useState, type ReactNode } from 'react'
import type { SxProps, Theme } from '@mui/material'
import RenameSafeDialog from '../components/RenameSafe/RenameSafeDialog'
import type { RenameTarget } from '../components/RenameSafe/types'

export type { RenameTarget, RenameClickTarget } from '../components/RenameSafe/types'

/**
 * Owns a single RenameSafeDialog. Call openRename(target) to rename; render renameDialog
 * once in a place that stays mounted (NOT inside a popup that closes on the rename click).
 *
 * @param options.dialogSx - elevate the dialog above a parent modal (e.g. inside the Accounts modal).
 */
export function useRenameSafe(options?: { dialogSx?: SxProps<Theme> }): {
  openRename: (target: RenameTarget) => void
  renameDialog: ReactNode
} {
  const [target, setTarget] = useState<RenameTarget | null>(null)
  const openRename = useCallback((next: RenameTarget) => setTarget(next), [])
  const renameDialog = target ? (
    <RenameSafeDialog target={target} onClose={() => setTarget(null)} sx={options?.dialogSx} />
  ) : null
  return { openRename, renameDialog }
}
