import { useState, type MouseEvent } from 'react'
import { MoreVertical, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useRenameSafe } from '@/features/spaces'
import { RENAME_DIALOG_Z_INDEX } from '@/config/zIndices'

interface PinnedSafeContextMenuProps {
  address: string
  chainIds: string[]
  name: string
}

const PinnedSafeContextMenu = ({ address, chainIds, name }: PinnedSafeContextMenuProps) => {
  const [menuOpen, setMenuOpen] = useState(false)
  // Trusted/pinned safes are non-space → the dialog writes the local name. Elevate it above the
  // Accounts modal (z-overlay 1400) so it isn't rendered behind.
  const { openRename, renameDialog } = useRenameSafe({ dialogSx: { zIndex: RENAME_DIALOG_Z_INDEX } })

  const handleRename = (e: MouseEvent) => {
    e.stopPropagation()
    setMenuOpen(false)
    openRename({ address, chainIds, currentName: name, isSpaceSafe: false, spaceId: null })
  }

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="shrink-0"
              onClick={(e) => e.stopPropagation()}
              data-testid="safe-options-btn"
            />
          }
        >
          <MoreVertical className="size-4" />
          <span className="sr-only">Safe options</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleRename} onSelect={(e) => e.stopPropagation()} data-testid="rename-btn">
            <Pencil className="size-4 text-success" />
            <span>Rename</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {renameDialog}
    </>
  )
}

export default PinnedSafeContextMenu
