import { type MouseEvent, useState } from 'react'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'
import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import DeleteSpaceDialog from '@/features/spaces/components/SpaceSettings/DeleteSpaceDialog'
import UpdateSpaceDialog from '@/features/spaces/components/SpaceSettings/UpdateSpaceDialog'
import Track from '@/components/common/Track'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

enum ModalType {
  RENAME = 'rename',
  REMOVE = 'remove',
}

const defaultOpen = { [ModalType.RENAME]: false, [ModalType.REMOVE]: false }

const SpaceContextMenuNew = ({ space }: { space: GetSpaceResponse }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [open, setOpen] = useState<typeof defaultOpen>(defaultOpen)

  const handleOpenModal = (e: MouseEvent, type: keyof typeof open) => {
    e.stopPropagation()
    setIsMenuOpen(false)
    setOpen((prev) => ({ ...prev, [type]: true }))
  }

  const handleCloseModal = () => {
    setOpen(defaultOpen)
  }

  return (
    <>
      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation()
              }}
            />
          }
        >
          <MoreVertical className="size-4 text-border" />
          <span className="sr-only">Space actions</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={(e) => handleOpenModal(e, ModalType.RENAME)} onSelect={(e) => e.stopPropagation()}>
            <Pencil className="text-success" />
            <span>Rename</span>
          </DropdownMenuItem>

          <Track {...SPACE_EVENTS.DELETE_SPACE_MODAL} label={SPACE_LABELS.space_context_menu}>
            <DropdownMenuItem
              data-testid="remove-button-spaces-new"
              onClick={(e) => handleOpenModal(e, ModalType.REMOVE)}
              onSelect={(e) => e.stopPropagation()}
              variant="destructive"
            >
              <Trash2 />
              <span>Remove</span>
            </DropdownMenuItem>
          </Track>
        </DropdownMenuContent>
      </DropdownMenu>

      {open[ModalType.RENAME] && <UpdateSpaceDialog space={space} onClose={handleCloseModal} />}

      {open[ModalType.REMOVE] && <DeleteSpaceDialog space={space} onClose={handleCloseModal} />}
    </>
  )
}

export default SpaceContextMenuNew
