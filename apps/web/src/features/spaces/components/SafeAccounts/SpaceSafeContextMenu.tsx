import { type SafeItem, type MultiChainSafeItem, isMultiChainSafeItem } from '@/hooks/safes'
import RemoveSafeDialog from './RemoveSafeDialog'
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
import { useAppSelector } from '@/store'
import { selectAllAddressBooks } from '@/store/addressBookSlice'
import { useMergedAddressBooks } from '@/hooks/useAllAddressBooks'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { trackEvent } from '@/services/analytics'
import { useIsAdmin, useCurrentSpaceId, useRenameSafe } from '@/features/spaces'

const SpaceSafeContextMenu = ({ safeItem }: { safeItem: SafeItem | MultiChainSafeItem }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | undefined>()
  const [removeOpen, setRemoveOpen] = useState(false)
  const isAdmin = useIsAdmin()
  const spaceId = useCurrentSpaceId()
  const { openRename, renameDialog } = useRenameSafe()

  const allAddressBooks = useAppSelector(selectAllAddressBooks)
  const { getFromSpaceByAddress } = useMergedAddressBooks()
  const chainIds = isMultiChainSafeItem(safeItem) ? safeItem.safes.map((safe) => safe.chainId) : [safeItem.chainId]
  // Rename here writes the shared (space) name, so prefill that — resolved address-level (one name
  // per address) — and only fall back to the local name. Without this the dialog opens with the
  // personal local name.
  const localName = isMultiChainSafeItem(safeItem)
    ? safeItem.name
    : allAddressBooks[safeItem.chainId]?.[safeItem.address]
  const spaceName = getFromSpaceByAddress(safeItem.address)?.name
  const name = spaceName ?? localName

  // Rename + Remove are both admin-only in a space; with no actions there is nothing to show.
  if (!isAdmin) return null

  const handleOpenContextMenu = (e: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>) => {
    e.preventDefault()
    e.stopPropagation()
    setAnchorEl(e.currentTarget)
  }

  const handleCloseContextMenu = (e: Event) => {
    e.stopPropagation()
    setAnchorEl(undefined)
  }

  const handleRename = (e: MouseEvent) => {
    e.stopPropagation()
    setAnchorEl(undefined)
    openRename({ address: safeItem.address, chainIds, currentName: name || '', isSpaceSafe: true, spaceId })
  }

  const handleRemove = (e: MouseEvent) => {
    e.stopPropagation()
    trackEvent({ ...SPACE_EVENTS.DELETE_ACCOUNT_MODAL })
    setAnchorEl(undefined)
    setRemoveOpen(true)
  }

  return (
    <>
      <span
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        onMouseDown={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
      >
        <IconButton edge="end" size="small" onClick={handleOpenContextMenu}>
          <MoreVertIcon />
        </IconButton>
      </span>
      <ContextMenu anchorEl={anchorEl} open={!!anchorEl} onClose={handleCloseContextMenu} autoFocus={false}>
        <MenuItem onClick={handleRename}>
          <ListItemIcon>
            <SvgIcon component={EditIcon} inheritViewBox fontSize="small" color="success" />
          </ListItemIcon>
          <ListItemText>Rename</ListItemText>
        </MenuItem>

        <MenuItem onClick={handleRemove}>
          <ListItemIcon>
            <SvgIcon component={DeleteIcon} inheritViewBox fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Remove</ListItemText>
        </MenuItem>
      </ContextMenu>

      {renameDialog}

      {removeOpen && <RemoveSafeDialog safeItem={safeItem} handleClose={() => setRemoveOpen(false)} />}
    </>
  )
}

export default SpaceSafeContextMenu
