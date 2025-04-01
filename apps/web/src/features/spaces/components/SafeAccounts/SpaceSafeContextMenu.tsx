import type { SafeItem } from '@/features/myAccounts/hooks/useAllSafes'
import type { MultiChainSafeItem } from '@/features/myAccounts/hooks/useAllSafesGrouped'
import RemoveSafeDialog from '@/features/spaces/components/SafeAccounts/RemoveSafeDialog'
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
import EntryDialog from '@/components/address-book/EntryDialog'
import { useAppSelector } from '@/store'
import { selectAllAddressBooks } from '@/store/addressBookSlice'
import { isMultiChainSafeItem } from '@/features/multichain/utils/utils'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { trackEvent } from '@/services/analytics'
import { useIsAdmin } from '@/features/spaces/hooks/useSpaceMembers'

enum ModalType {
  RENAME = 'rename',
  REMOVE = 'remove',
}

const defaultOpen = { [ModalType.RENAME]: false, [ModalType.REMOVE]: false }

const SpaceSafeContextMenu = ({ safeItem }: { safeItem: SafeItem | MultiChainSafeItem }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | undefined>()
  const [open, setOpen] = useState<typeof defaultOpen>(defaultOpen)
  const isAdmin = useIsAdmin()

  const allAddressBooks = useAppSelector(selectAllAddressBooks)
  const chainIds = isMultiChainSafeItem(safeItem) ? safeItem.safes.map((safe) => safe.chainId) : [safeItem.chainId]
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
        <MenuItem onClick={(e) => handleOpenModal(e, ModalType.RENAME)}>
          <ListItemIcon>
            <SvgIcon component={EditIcon} inheritViewBox fontSize="small" color="success" />
          </ListItemIcon>
          <ListItemText>{hasName ? 'Rename' : 'Give name'}</ListItemText>
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

      {open[ModalType.RENAME] && (
        <EntryDialog
          handleClose={handleCloseModal}
          defaultValues={{ name: name || '', address: safeItem.address }}
          chainIds={chainIds}
          currentChainId={isMultiChainSafeItem(safeItem) ? undefined : chainIds[0]}
          disableAddressInput
        />
      )}

      {open[ModalType.REMOVE] && <RemoveSafeDialog safeItem={safeItem} handleClose={handleCloseModal} />}
    </>
  )
}

export default SpaceSafeContextMenu
