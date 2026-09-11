import { type MouseEvent, useState } from 'react'
import { ADMIN_ONLY_DELETE_CONTACT_MESSAGE, ADMIN_ONLY_EDIT_CONTACT_MESSAGE } from '@/utils/addressBookNotifications'
import Track from '@/components/common/Track'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import EditIcon from '@/public/images/common/edit.svg'
import DeleteIcon from '@/public/images/common/delete.svg'
import EditContactDialog from './EditContactDialog'
import DeleteContactDialog from './DeleteContactDialog'
import { useIsAdmin } from '@/features/spaces'
import type { SpaceAddressBookItemDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { EllipsisVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'

enum ModalType {
  EDIT = 'edit',
  REMOVE = 'remove',
}

const defaultOpen = { [ModalType.EDIT]: false, [ModalType.REMOVE]: false }

const SpaceAddressBookActions = ({
  entry,
  isCompact = false,
}: {
  entry: SpaceAddressBookItemDto
  isCompact?: boolean
}) => {
  const [open, setOpen] = useState<typeof defaultOpen>(defaultOpen)
  const isAdmin = useIsAdmin()

  const handleOpenModal = (e: MouseEvent, type: keyof typeof open) => {
    e.stopPropagation()
    setOpen((prev) => ({ ...prev, [type]: true }))
  }

  const handleCloseModal = () => {
    setOpen(defaultOpen)
  }

  const dialogs = (
    <>
      {open[ModalType.EDIT] && <EditContactDialog entry={entry} onClose={handleCloseModal} />}

      {open[ModalType.REMOVE] && (
        <DeleteContactDialog
          name={entry.name}
          address={entry.address}
          networks={entry.chainIds}
          onClose={handleCloseModal}
        />
      )}
    </>
  )

  if (isCompact) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label="Contact actions">
                <EllipsisVertical className="text-muted-foreground size-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <Track {...SPACE_EVENTS.EDIT_ADDRESS}>
              <DropdownMenuItem
                disabled={!isAdmin}
                onClick={isAdmin ? (e) => handleOpenModal(e, ModalType.EDIT) : undefined}
              >
                Edit entry
              </DropdownMenuItem>
            </Track>
            <Track {...SPACE_EVENTS.REMOVE_ADDRESS}>
              <DropdownMenuItem
                variant="destructive"
                disabled={!isAdmin}
                onClick={isAdmin ? (e) => handleOpenModal(e, ModalType.REMOVE) : undefined}
              >
                Delete entry
              </DropdownMenuItem>
            </Track>
          </DropdownMenuContent>
        </DropdownMenu>
        {dialogs}
      </>
    )
  }

  return (
    <>
      <Track {...SPACE_EVENTS.EDIT_ADDRESS}>
        <Tooltip>
          <TooltipTrigger
            render={
              <span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Edit entry"
                  disabled={!isAdmin}
                  onClick={isAdmin ? (e) => handleOpenModal(e, ModalType.EDIT) : undefined}
                >
                  <EditIcon className="size-4 text-[var(--color-border-main)]" />
                </Button>
              </span>
            }
          />
          <TooltipContent>{isAdmin ? 'Edit entry' : ADMIN_ONLY_EDIT_CONTACT_MESSAGE}</TooltipContent>
        </Tooltip>
      </Track>

      <Track {...SPACE_EVENTS.REMOVE_ADDRESS}>
        <Tooltip>
          <TooltipTrigger
            render={
              <span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Delete entry"
                  disabled={!isAdmin}
                  onClick={isAdmin ? (e) => handleOpenModal(e, ModalType.REMOVE) : undefined}
                >
                  <DeleteIcon className="size-4 text-[var(--color-error-main)]" />
                </Button>
              </span>
            }
          />
          <TooltipContent>{isAdmin ? 'Delete entry' : ADMIN_ONLY_DELETE_CONTACT_MESSAGE}</TooltipContent>
        </Tooltip>
      </Track>

      {dialogs}
    </>
  )
}

export default SpaceAddressBookActions
