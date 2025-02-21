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

enum ModalType {
  RENAME = 'rename',
  REMOVE = 'remove',
}

const defaultOpen = { [ModalType.RENAME]: false, [ModalType.REMOVE]: false }

const OrgSafeContextMenu = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | undefined>()
  const [open, setOpen] = useState<typeof defaultOpen>(defaultOpen)

  const handleOpenContextMenu = (e: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>) => {
    e.stopPropagation()
    setAnchorEl(e.currentTarget)
  }

  const handleCloseContextMenu = (e: Event) => {
    e.stopPropagation()
    setAnchorEl(undefined)
  }

  const handleOpenModal = (type: keyof typeof open) => () => {
    setAnchorEl(undefined)
    setOpen((prev) => ({ ...prev, [type]: true }))
  }

  const hasName = false

  return (
    <>
      <IconButton data-testid="safe-options-btn" edge="end" size="small" onClick={handleOpenContextMenu}>
        <MoreVertIcon sx={({ palette }) => ({ color: palette.border.main })} />
      </IconButton>
      <ContextMenu anchorEl={anchorEl} open={!!anchorEl} onClose={handleCloseContextMenu}>
        <MenuItem onClick={handleOpenModal(ModalType.RENAME)}>
          <ListItemIcon>
            <SvgIcon component={EditIcon} inheritViewBox fontSize="small" color="success" />
          </ListItemIcon>
          <ListItemText data-testid="rename-btn">{hasName ? 'Rename' : 'Give name'}</ListItemText>
        </MenuItem>

        <MenuItem onClick={handleOpenModal(ModalType.REMOVE)}>
          <ListItemIcon>
            <SvgIcon component={DeleteIcon} inheritViewBox fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText data-testid="remove-btn">Remove</ListItemText>
        </MenuItem>
      </ContextMenu>

      {open[ModalType.RENAME] && <>{/* TODO: Render rename safe account modal */}</>}

      {open[ModalType.REMOVE] && <>{/* TODO: Render Remove safe account modal */}</>}
    </>
  )
}

export default OrgSafeContextMenu
