import type { SafeItem } from '@/features/myAccounts/hooks/useAllSafes'
import type { MultiChainSafeItem } from '@/features/myAccounts/hooks/useAllSafesGrouped'
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
import { isMultiChainSafeItem } from '@/features/multichain/utils/utils'
import { useIsAdmin } from '@/features/spaces/hooks/useSpaceMembers'

const SpaceSafeContextMenu = ({ safeItem }: { safeItem: SafeItem | MultiChainSafeItem }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | undefined>()
  const isAdmin = useIsAdmin()

  const allAddressBooks = useAppSelector(selectAllAddressBooks)
  const name = isMultiChainSafeItem(safeItem) ? safeItem.name : allAddressBooks[safeItem.chainId]?.[safeItem.address]
  const hasName = !!name

  const handleOpenContextMenu = (e: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>) => {
    e.stopPropagation()
    setAnchorEl(e.currentTarget)
  }

  const handleCloseContextMenu = (e: Event) => {
    e.stopPropagation()
    setAnchorEl(undefined)
  }

  return (
    <>
      <IconButton edge="end" size="small" onClick={handleOpenContextMenu}>
        <MoreVertIcon sx={({ palette }) => ({ color: palette.border.main })} />
      </IconButton>
      <ContextMenu anchorEl={anchorEl} open={!!anchorEl} onClose={handleCloseContextMenu}>
        <MenuItem onClick={() => {}}>
          <ListItemIcon>
            <SvgIcon component={EditIcon} inheritViewBox fontSize="small" color="success" />
          </ListItemIcon>
          <ListItemText>{hasName ? 'Rename' : 'Give name'}</ListItemText>
        </MenuItem>

        {isAdmin && (
          <MenuItem onClick={() => {}}>
            <ListItemIcon>
              <SvgIcon component={DeleteIcon} inheritViewBox fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Remove</ListItemText>
          </MenuItem>
        )}
      </ContextMenu>
    </>
  )
}

export default SpaceSafeContextMenu
