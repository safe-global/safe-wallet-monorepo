import type { MouseEvent } from 'react'
import { useState, type ReactElement } from 'react'
import ListItemIcon from '@mui/material/ListItemIcon'
import IconButton from '@mui/material/IconButton'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import MenuItem from '@mui/material/MenuItem'
import ListItemText from '@mui/material/ListItemText'

import EntryDialog from '@/components/address-book/EntryDialog'
import SafeListRemoveDialog from '@/components/sidebar/SafeListRemoveDialog'
import EditIcon from '@/public/images/common/edit.svg'
import DeleteIcon from '@/public/images/common/delete.svg'
import PlusIcon from '@/public/images/common/plus.svg'
import ContextMenu from '@/components/common/ContextMenu'
import { trackEvent, OVERVIEW_EVENTS, OVERVIEW_LABELS } from '@/services/analytics'
import { SvgIcon } from '@mui/material'
import useAddressBook from '@/hooks/useAddressBook'
import { AppRoutes } from '@/config/routes'
import router from 'next/router'
import { CreateSafeOnNewChain } from '@/features/multichain/components/CreateSafeOnNewChain'

enum ModalType {
  RENAME = 'rename',
  REMOVE = 'remove',
  ADD_CHAIN = 'add_chain',
}

const defaultOpen = { [ModalType.RENAME]: false, [ModalType.REMOVE]: false, [ModalType.ADD_CHAIN]: false }

const SafeListContextMenu = ({
  name,
  address,
  chainId,
  addNetwork,
  rename,
  undeployedSafe,
}: {
  name: string
  address: string
  chainId: string
  addNetwork: boolean
  rename: boolean
  undeployedSafe: boolean
}): ReactElement => {
  const addressBook = useAddressBook()
  const hasName = address in addressBook

  const [anchorEl, setAnchorEl] = useState<HTMLElement | undefined>()
  const [open, setOpen] = useState<typeof defaultOpen>(defaultOpen)

  const trackingLabel =
    router.pathname === AppRoutes.welcome.accounts ? OVERVIEW_LABELS.login_page : OVERVIEW_LABELS.sidebar

  const handleOpenContextMenu = (e: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>) => {
    setAnchorEl(e.currentTarget)
  }

  const handleCloseContextMenu = () => {
    setAnchorEl(undefined)
  }

  const handleOpenModal =
    (type: keyof typeof open, event: typeof OVERVIEW_EVENTS.SIDEBAR_RENAME | typeof OVERVIEW_EVENTS.SIDEBAR_RENAME) =>
    () => {
      handleCloseContextMenu()
      setOpen((prev) => ({ ...prev, [type]: true }))

      trackEvent({ ...event, label: trackingLabel })
    }

  const handleCloseModal = () => {
    setOpen(defaultOpen)
  }

  return (
    <>
      <IconButton data-testid="safe-options-btn" edge="end" size="small" onClick={handleOpenContextMenu}>
        <MoreVertIcon sx={({ palette }) => ({ color: palette.border.main })} />
      </IconButton>
      <ContextMenu anchorEl={anchorEl} open={!!anchorEl} onClose={handleCloseContextMenu}>
        {rename && (
          <MenuItem onClick={handleOpenModal(ModalType.RENAME, OVERVIEW_EVENTS.SIDEBAR_RENAME)}>
            <ListItemIcon>
              <SvgIcon component={EditIcon} inheritViewBox fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText data-testid="rename-btn">{hasName ? 'Rename' : 'Give name'}</ListItemText>
          </MenuItem>
        )}

        {undeployedSafe && (
          <MenuItem onClick={handleOpenModal(ModalType.REMOVE, OVERVIEW_EVENTS.REMOVE_FROM_WATCHLIST)}>
            <ListItemIcon>
              <SvgIcon component={DeleteIcon} inheritViewBox fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText data-testid="remove-btn">Remove</ListItemText>
          </MenuItem>
        )}

        {addNetwork && (
          <MenuItem onClick={handleOpenModal(ModalType.ADD_CHAIN, OVERVIEW_EVENTS.ADD_NEW_NETWORK)}>
            <ListItemIcon>
              <SvgIcon component={PlusIcon} inheritViewBox fontSize="small" color="primary" />
            </ListItemIcon>
            <ListItemText data-testid="add-chain-btn">Add another network</ListItemText>
          </MenuItem>
        )}
      </ContextMenu>

      {open[ModalType.RENAME] && (
        <EntryDialog
          handleClose={handleCloseModal}
          defaultValues={{ name, address }}
          chainIds={[chainId]}
          disableAddressInput
        />
      )}

      {open[ModalType.REMOVE] && (
        <SafeListRemoveDialog handleClose={handleCloseModal} address={address} chainId={chainId} />
      )}

      {open[ModalType.ADD_CHAIN] && (
        <CreateSafeOnNewChain
          onClose={handleCloseModal}
          currentName={name}
          deployedChainIds={[chainId]}
          open
          safeAddress={address}
        />
      )}
    </>
  )
}

export default SafeListContextMenu
