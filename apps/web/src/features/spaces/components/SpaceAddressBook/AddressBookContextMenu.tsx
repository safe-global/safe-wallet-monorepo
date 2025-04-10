import { type MouseEvent, useState } from 'react'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import { SvgIcon } from '@mui/material'
import IconButton from '@mui/material/IconButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import MenuItem from '@mui/material/MenuItem'
import ContextMenu from '@/components/common/ContextMenu'
import DeleteIcon from '@/public/images/common/delete.svg'
import EditIcon from '@/public/images/common/edit.svg'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { trackEvent } from '@/services/analytics'
import { useIsAdmin } from '@/features/spaces/hooks/useSpaceMembers'

import EditContactDialog from './EditContactDialog'
import RemoveContactDialog from './DeleteContactDialog'
import type { SpaceAddressBookEntry } from '../../types'

enum ModalType {
  EDIT = 'edit',
  REMOVE = 'remove',
}

const defaultOpen = { [ModalType.EDIT]: false, [ModalType.REMOVE]: false }

const AddressBookContextMenu = ({ entry }: { entry: SpaceAddressBookEntry }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | undefined>()
  const [open, setOpen] = useState<typeof defaultOpen>(defaultOpen)
  const isAdmin = useIsAdmin()

  const handleOpenContextMenu = (e: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>) => {
    e.stopPropagation()
    setAnchorEl(e.currentTarget)
  }

  const handleCloseContextMenu = (e: Event) => {
    e.stopPropagation()
    setAnchorEl(undefined)
  }

  const handleOpenModal = (e: MouseEvent, type: keyof typeof open) => {
    e.stopPropagation()
    if (type === ModalType.REMOVE) trackEvent({ ...SPACE_EVENTS.DELETE_ACCOUNT_MODAL })
    setAnchorEl(undefined)
    setOpen((prev) => ({ ...prev, [type]: true }))
  }

  const handleCloseModal = () => {
    setOpen(defaultOpen)
  }

  return (
    <>
      <IconButton edge="end" size="small" onClick={handleOpenContextMenu}>
        <MoreVertIcon sx={({ palette }) => ({ color: palette.border.main })} />
      </IconButton>
      <ContextMenu anchorEl={anchorEl} open={!!anchorEl} onClose={handleCloseContextMenu}>
        <MenuItem onClick={(e) => handleOpenModal(e, ModalType.EDIT)}>
          <ListItemIcon>
            <SvgIcon component={EditIcon} inheritViewBox fontSize="small" color="success" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>

        {isAdmin && (
          <MenuItem onClick={(e) => handleOpenModal(e, ModalType.REMOVE)}>
            <ListItemIcon>
              <SvgIcon component={DeleteIcon} inheritViewBox fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Remove</ListItemText>
          </MenuItem>
        )}
      </ContextMenu>

      {open[ModalType.EDIT] && <EditContactDialog entry={entry} onClose={handleCloseModal} />}

      {open[ModalType.REMOVE] && (
        <RemoveContactDialog
          name={entry.name}
          address={entry.address}
          networks={entry.networks}
          onClose={handleCloseModal}
        />
      )}
    </>
  )
}

export default AddressBookContextMenu
