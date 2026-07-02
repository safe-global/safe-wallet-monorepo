import { type MouseEvent, useState } from 'react'
import Track from '@/components/common/Track'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { SvgIcon, Tooltip } from '@mui/material'
import EditIcon from '@/public/images/common/edit.svg'
import DeleteIcon from '@/public/images/common/delete.svg'
import EditContactDialog from './EditContactDialog'
import DeleteContactDialog from './DeleteContactDialog'
import { useIsAdmin } from '@/features/spaces'
import type { SpaceAddressBookItemDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import IconButton from '@mui/material/IconButton'
import { EllipsisVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { useIsMobile } from '@/hooks/use-mobile'

enum ModalType {
  EDIT = 'edit',
  REMOVE = 'remove',
}

const defaultOpen = { [ModalType.EDIT]: false, [ModalType.REMOVE]: false }

const SpaceAddressBookActions = ({ entry }: { entry: SpaceAddressBookItemDto }) => {
  const [open, setOpen] = useState<typeof defaultOpen>(defaultOpen)
  const isAdmin = useIsAdmin()
  const isMobile = useIsMobile()

  const handleOpenModal = (e: MouseEvent, type: keyof typeof open) => {
    e.stopPropagation()
    setOpen((prev) => ({ ...prev, [type]: true }))
  }

  const handleCloseModal = () => {
    setOpen(defaultOpen)
  }

  if (!isAdmin) return null

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

  if (isMobile) {
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
              <DropdownMenuItem onClick={(e) => handleOpenModal(e, ModalType.EDIT)}>Edit entry</DropdownMenuItem>
            </Track>
            <Track {...SPACE_EVENTS.REMOVE_ADDRESS}>
              <DropdownMenuItem variant="destructive" onClick={(e) => handleOpenModal(e, ModalType.REMOVE)}>
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
        <Tooltip title="Edit entry" placement="top">
          <IconButton onClick={(e) => handleOpenModal(e, ModalType.EDIT)} size="small">
            <SvgIcon component={EditIcon} inheritViewBox color="border" fontSize="small" />
          </IconButton>
        </Tooltip>
      </Track>

      <Track {...SPACE_EVENTS.REMOVE_ADDRESS}>
        <Tooltip title="Delete entry" placement="top">
          <IconButton onClick={(e) => handleOpenModal(e, ModalType.REMOVE)} size="small">
            <SvgIcon component={DeleteIcon} inheritViewBox color="error" fontSize="small" />
          </IconButton>
        </Tooltip>
      </Track>

      {dialogs}
    </>
  )
}

export default SpaceAddressBookActions
