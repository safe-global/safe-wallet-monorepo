import { type MouseEvent, useState } from 'react'
import Track from '@/components/common/Track'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { SvgIcon, Tooltip } from '@mui/material'
import EditIcon from '@/public/images/common/edit.svg'
import DeleteIcon from '@/public/images/common/delete.svg'
import EditContactDialog from '@/features/spaces/components/SpaceAddressBook/EditContactDialog'
import DeleteContactDialog from '@/features/spaces/components/SpaceAddressBook/DeleteContactDialog'
import { useIsAdmin } from '@/features/spaces/hooks/useSpaceMembers'
import type { SpaceAddressBookItemDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import IconButton from '@mui/material/IconButton'

enum ModalType {
  EDIT = 'edit',
  REMOVE = 'remove',
}

const defaultOpen = { [ModalType.EDIT]: false, [ModalType.REMOVE]: false }

const SpaceAddressBookActions = ({ entry }: { entry: SpaceAddressBookItemDto }) => {
  const [open, setOpen] = useState<typeof defaultOpen>(defaultOpen)
  const isAdmin = useIsAdmin()

  const handleOpenModal = (e: MouseEvent, type: keyof typeof open) => {
    e.stopPropagation()
    setOpen((prev) => ({ ...prev, [type]: true }))
  }

  const handleCloseModal = () => {
    setOpen(defaultOpen)
  }

  if (!isAdmin) return null

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
}

export default SpaceAddressBookActions
