import { useState, type MouseEvent } from 'react'
import { MoreVertical, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import EntryDialog from '@/components/address-book/EntryDialog'

interface PinnedSafeContextMenuProps {
  address: string
  chainId: string
  name: string
}

const PinnedSafeContextMenu = ({ address, chainId, name }: PinnedSafeContextMenuProps) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)

  const handleRename = (e: MouseEvent) => {
    e.stopPropagation()
    setMenuOpen(false)
    setRenameOpen(true)
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

      {/* MUI EntryDialog defaults to z-index 1300. Elevate above shadcn Dialog
          which now uses --z-overlay (1400) for its backdrop. */}
      {renameOpen && (
        <EntryDialog
          handleClose={() => setRenameOpen(false)}
          defaultValues={{ name, address }}
          chainIds={[chainId]}
          disableAddressInput
          sx={{ zIndex: 1500 }}
        />
      )}
    </>
  )
}

export default PinnedSafeContextMenu
