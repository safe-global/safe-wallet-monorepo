import type { MouseEvent } from 'react'
import { useState, type ReactElement } from 'react'
import ListItemIcon from '@mui/material/ListItemIcon'
import IconButton from '@mui/material/IconButton'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import MenuItem from '@mui/material/MenuItem'
import ListItemText from '@mui/material/ListItemText'

import SafeListRemoveDialog from '@/components/sidebar/SafeListRemoveDialog'
import NestedSafesIcon from '@/public/images/sidebar/nested-safes-icon.svg'
import EditIcon from '@/public/images/common/edit.svg'
import DeleteIcon from '@/public/images/common/delete.svg'
import PlusIcon from '@/public/images/common/plus.svg'
import ContextMenu from '@/components/common/ContextMenu'
import { trackEvent, OVERVIEW_EVENTS, OVERVIEW_LABELS, type AnalyticsEvent } from '@/services/analytics'
import { SvgIcon } from '@mui/material'
import { AppRoutes } from '@/config/routes'
import router from 'next/router'
import { CreateSafeOnNewChain } from '@/features/multichain'
import { useOwnersGetSafesByOwnerV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/owners'
import { NestedSafesPopover } from '../NestedSafesPopover'
import { NESTED_SAFE_EVENTS, NESTED_SAFE_LABELS } from '@/services/analytics/events/nested-safes'
import { useHasFeature } from '@/hooks/useChains'
import { useNestedSafesVisibility } from '@/hooks/useNestedSafesVisibility'
import { useRenameSafe } from '@/features/spaces'
import { RENAME_DIALOG_Z_INDEX } from '@/config/zIndices'

import { FEATURES } from '@safe-global/utils/utils/chains'

enum ModalType {
  NESTED_SAFES = 'nested_safes',
  REMOVE = 'remove',
  ADD_CHAIN = 'add_chain',
}

const defaultOpen = {
  [ModalType.NESTED_SAFES]: false,
  [ModalType.REMOVE]: false,
  [ModalType.ADD_CHAIN]: false,
}

const SafeListContextMenu = ({
  name,
  address,
  chainId,
  addNetwork,
  rename,
  undeployedSafe,
  hideNestedSafes = false,
  onClose,
}: {
  name: string
  address: string
  chainId: string
  addNetwork: boolean
  rename: boolean
  undeployedSafe: boolean
  hideNestedSafes?: boolean
  onClose?: () => void
}): ReactElement => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const isNestedSafesEnabled = useHasFeature(FEATURES.NESTED_SAFES)
  const { currentData: ownedSafes } = useOwnersGetSafesByOwnerV1Query(
    { chainId, ownerAddress: address },
    { skip: !isNestedSafesEnabled || hideNestedSafes || !address || !anchorEl },
  )
  const [open, setOpen] = useState<typeof defaultOpen>(defaultOpen)
  // Local (non-space) rename; elevate above the Trusted Safes modal overlay (--z-overlay: 1400).
  const { openRename, renameDialog } = useRenameSafe({ dialogSx: { zIndex: RENAME_DIALOG_Z_INDEX } })

  const nestedSafesForChain = ownedSafes?.safes ?? []
  const { allSafesWithStatus, visibleSafes, hasCompletedCuration, isLoading, startFiltering } =
    useNestedSafesVisibility(nestedSafesForChain, chainId)

  const trackingLabel =
    router.pathname === AppRoutes.welcome.accounts ? OVERVIEW_LABELS.login_page : OVERVIEW_LABELS.sidebar

  const handleOpenContextMenu = (e: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>) => {
    e.stopPropagation()
    e.preventDefault()
    setAnchorEl(e.currentTarget)
  }

  const handleCloseContextMenu = () => {
    setAnchorEl(null)
  }

  const handleOpenModal =
    (type: keyof typeof open, event: AnalyticsEvent) => (e: MouseEvent<HTMLLIElement, globalThis.MouseEvent>) => {
      e.stopPropagation()
      e.preventDefault()
      if (type !== ModalType.NESTED_SAFES) {
        handleCloseContextMenu()
      }
      if (type === ModalType.NESTED_SAFES) {
        startFiltering()
      }
      setOpen((prev) => ({ ...prev, [type]: true }))

      trackEvent({ ...event, label: trackingLabel })
    }

  const handleCloseModal = () => {
    setOpen(defaultOpen)
  }

  const handleRename = (e: MouseEvent<HTMLLIElement, globalThis.MouseEvent>) => {
    e.stopPropagation()
    e.preventDefault()
    handleCloseContextMenu()
    trackEvent({ ...OVERVIEW_EVENTS.SIDEBAR_RENAME, label: trackingLabel })
    openRename({ address, chainIds: [chainId], currentName: name, isSpaceSafe: false, spaceId: null })
  }

  return (
    <>
      <IconButton data-testid="safe-options-btn" edge="end" size="small" onClick={handleOpenContextMenu}>
        <MoreVertIcon sx={({ palette }) => ({ color: palette.border.main })} />
      </IconButton>
      <ContextMenu
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={handleCloseContextMenu}
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        {isNestedSafesEnabled &&
          !hideNestedSafes &&
          !undeployedSafe &&
          nestedSafesForChain &&
          nestedSafesForChain.length > 0 && (
            <MenuItem
              onClick={handleOpenModal(ModalType.NESTED_SAFES, {
                ...NESTED_SAFE_EVENTS.OPEN_LIST,
                label: NESTED_SAFE_LABELS.sidebar,
              })}
            >
              <ListItemIcon>
                <SvgIcon component={NestedSafesIcon} inheritViewBox fontSize="small" color="success" />
              </ListItemIcon>
              <ListItemText data-testid="nested-safes-btn">Nested Safes</ListItemText>
            </MenuItem>
          )}

        {rename && (
          <MenuItem onClick={handleRename}>
            <ListItemIcon>
              <SvgIcon component={EditIcon} inheritViewBox fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText data-testid="rename-btn">Rename</ListItemText>
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

      {open[ModalType.NESTED_SAFES] && (
        <NestedSafesPopover
          anchorEl={anchorEl}
          onClose={() => {
            handleCloseModal()
            onClose?.()
          }}
          rawNestedSafes={nestedSafesForChain}
          allSafesWithStatus={allSafesWithStatus}
          visibleSafes={visibleSafes}
          hasCompletedCuration={hasCompletedCuration}
          isLoading={isLoading}
          hideCreationButton
        />
      )}

      {renameDialog}

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
