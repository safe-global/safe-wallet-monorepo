import type { MouseEvent } from 'react'
import { useState, type ReactElement } from 'react'
import ListItemIcon from '@mui/material/ListItemIcon'
import IconButton from '@mui/material/IconButton'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import MenuItem from '@mui/material/MenuItem'
import ListItemText from '@mui/material/ListItemText'

import EditIcon from '@/public/images/common/edit.svg'
import PlusIcon from '@/public/images/common/plus.svg'
import ContextMenu from '@/components/common/ContextMenu'
import { trackEvent, OVERVIEW_EVENTS, OVERVIEW_LABELS } from '@/services/analytics'
import { SvgIcon } from '@mui/material'
import { AppRoutes } from '@/config/routes'
import router from 'next/router'
import { CreateSafeOnNewChain } from '@/features/multichain'
import { useRenameSafe } from '@/features/spaces'
import { RENAME_DIALOG_Z_INDEX } from '@/config/zIndices'

enum ModalType {
  ADD_CHAIN = 'add_chain',
}

const defaultOpen = { [ModalType.ADD_CHAIN]: false }

const MultiAccountContextMenu = ({
  name,
  address,
  chainIds,
  addNetwork,
}: {
  name: string
  address: string
  chainIds: string[]
  addNetwork: boolean
}): ReactElement => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | undefined>()
  const [open, setOpen] = useState<typeof defaultOpen>(defaultOpen)
  // Local (non-space) rename; elevate above the Trusted Safes modal overlay (--z-overlay: 1400)
  // for the multichain group there. Harmless on the (non-modal) My accounts page.
  const { openRename, renameDialog } = useRenameSafe({ dialogSx: { zIndex: RENAME_DIALOG_Z_INDEX } })

  const handleOpenContextMenu = (e: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>) => {
    e.stopPropagation()
    setAnchorEl(e.currentTarget)
  }

  const handleCloseContextMenu = (event: MouseEvent) => {
    event.stopPropagation()
    setAnchorEl(undefined)
  }

  const handleOpenModal =
    (type: ModalType, event: typeof OVERVIEW_EVENTS.SIDEBAR_RENAME | typeof OVERVIEW_EVENTS.ADD_NEW_NETWORK) =>
    (e: MouseEvent) => {
      const trackingLabel =
        router.pathname === AppRoutes.welcome.accounts ? OVERVIEW_LABELS.login_page : OVERVIEW_LABELS.sidebar
      handleCloseContextMenu(e)
      setOpen((prev) => ({ ...prev, [type]: true }))

      trackEvent({ ...event, label: trackingLabel })
    }

  const handleCloseModal = () => {
    setOpen(defaultOpen)
  }

  const handleRename = (e: MouseEvent) => {
    const trackingLabel =
      router.pathname === AppRoutes.welcome.accounts ? OVERVIEW_LABELS.login_page : OVERVIEW_LABELS.sidebar
    handleCloseContextMenu(e)
    trackEvent({ ...OVERVIEW_EVENTS.SIDEBAR_RENAME, label: trackingLabel })
    openRename({ address, chainIds, currentName: name, isSpaceSafe: false, spaceId: null })
  }

  return (
    <>
      <IconButton data-testid="safe-options-btn" edge="end" size="small" onClick={handleOpenContextMenu}>
        <MoreVertIcon sx={({ palette }) => ({ color: palette.border.main })} />
      </IconButton>
      <ContextMenu anchorEl={anchorEl} open={!!anchorEl} onClose={handleCloseContextMenu}>
        <MenuItem onClick={handleRename}>
          <ListItemIcon>
            <SvgIcon component={EditIcon} inheritViewBox fontSize="small" color="success" />
          </ListItemIcon>
          <ListItemText data-testid="rename-btn">Rename</ListItemText>
        </MenuItem>
        {addNetwork && (
          <MenuItem onClick={handleOpenModal(ModalType.ADD_CHAIN, OVERVIEW_EVENTS.ADD_NEW_NETWORK)}>
            <ListItemIcon>
              <SvgIcon component={PlusIcon} inheritViewBox fontSize="small" color="primary" />
            </ListItemIcon>
            <ListItemText data-testid="add-chain-btn">Add another network</ListItemText>
          </MenuItem>
        )}
      </ContextMenu>

      {renameDialog}

      {open[ModalType.ADD_CHAIN] && (
        <CreateSafeOnNewChain
          onClose={handleCloseModal}
          currentName={name}
          deployedChainIds={chainIds}
          open
          safeAddress={address}
        />
      )}
    </>
  )
}

export default MultiAccountContextMenu
