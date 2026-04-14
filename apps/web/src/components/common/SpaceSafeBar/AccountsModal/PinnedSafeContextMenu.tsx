import { useState, type MouseEvent } from 'react'
import { MoreVertical, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import EntryDialog from '@/components/address-book/EntryDialog'
import useAddressBook from '@/hooks/useAddressBook'

interface PinnedSafeContextMenuProps {
  address: string
  chainId: string
  name: string
}

const PinnedSafeContextMenu = ({ address, chainId, name }: PinnedSafeContextMenuProps) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const addressBook = useAddressBook(chainId)
  const hasName = address in addressBook

  const handleRename = (e: MouseEvent) => {
    e.stopPropagation()
    setMenuOpen(false)
    setRenameOpen(true)
  }

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon-sm" className="shrink-0" onClick={(e) => e.stopPropagation()} />}
        >
          <MoreVertical className="size-4" />
          <span className="sr-only">Safe options</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleRename} onSelect={(e) => e.stopPropagation()}>
            <Pencil className="size-4 text-success" />
            <span>{hasName ? 'Rename' : 'Give name'}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {renameOpen && (
        <EntryDialog
          handleClose={() => setRenameOpen(false)}
          defaultValues={{ name, address }}
          chainIds={[chainId]}
          disableAddressInput
          sx={{ zIndex: 9300 }}
        />
      )}
    </>
  )
}

export default PinnedSafeContextMenu
