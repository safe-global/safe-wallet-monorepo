import { SvgIcon, Popover, Button, Box, Stack, IconButton, Typography, Tooltip } from '@mui/material'
import { useContext, useState } from 'react'
import type { ReactElement } from 'react'

import AddIcon from '@/public/images/common/add.svg'
import SettingsIcon from '@/public/images/sidebar/settings.svg'
import { ModalDialogTitle } from '@/components/common/ModalDialog'
import { CreateNestedSafeFlow } from '@/components/tx-flow/flows'
import { TxModalContext } from '@/components/tx-flow'
import { NestedSafesList } from '@/components/sidebar/NestedSafesList'
import { NestedSafeInfo } from '@/components/sidebar/NestedSafeInfo'
import Track from '@/components/common/Track'
import { NESTED_SAFE_EVENTS } from '@/services/analytics/events/nested-safes'
import CheckWallet from '@/components/common/CheckWallet'
import { useManageNestedSafes } from '@/components/sidebar/NestedSafesList/useManageNestedSafes'
import useHiddenNestedSafes from '@/hooks/useHiddenNestedSafes'

export function NestedSafesPopover({
  anchorEl,
  onClose,
  nestedSafes,
  hideCreationButton = false,
}: {
  anchorEl: HTMLElement | null
  onClose: () => void
  nestedSafes: Array<string>
  hideCreationButton?: boolean
}): ReactElement {
  const { setTxFlow } = useContext(TxModalContext)
  const [isManageMode, setIsManageMode] = useState(false)
  const hiddenSafes = useHiddenNestedSafes()
  const { toggleSafe, isSafeSelected, saveChanges, cancel, selectedCount } = useManageNestedSafes(nestedSafes)

  const visibleNestedSafes = nestedSafes.filter((address) => !hiddenSafes.includes(address))

  const onAdd = () => {
    setTxFlow(<CreateNestedSafeFlow />)
    onClose()
  }

  const handleManageClick = () => {
    setIsManageMode(true)
  }

  const handleSave = () => {
    saveChanges()
    setIsManageMode(false)
  }

  const handleCancel = () => {
    cancel()
    setIsManageMode(false)
  }

  const safesToShow = isManageMode ? nestedSafes : visibleNestedSafes

  return (
    <Popover
      open={!!anchorEl}
      anchorEl={anchorEl}
      onClose={isManageMode ? undefined : onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
      slotProps={{
        paper: {
          sx: {
            width: '370px',
            maxHeight: '590px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          },
        },
      }}
    >
      <ModalDialogTitle
        hideChainIndicator
        onClose={isManageMode ? undefined : onClose}
        sx={{ mt: -0.5, borderBottom: ({ palette }) => `1px solid ${palette.border.light}` }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
          <span>Nested Safes</span>
          {nestedSafes.length > 0 && !isManageMode && (
            <Tooltip title="Manage Safes">
              <IconButton
                onClick={handleManageClick}
                size="small"
                sx={{ ml: 1 }}
                data-testid="manage-nested-safes-button"
              >
                <SvgIcon component={SettingsIcon} inheritViewBox fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </ModalDialogTitle>
      <Stack
        data-testid="nested-safe-list"
        p={3}
        pt={2}
        display="flex"
        flexDirection="column"
        flex={1}
        overflow="hidden"
      >
        {isManageMode && (
          <Box mb={2}>
            <Typography variant="body2" color="text.secondary">
              {selectedCount} {selectedCount === 1 ? 'safe' : 'safes'} selected to hide
            </Typography>
          </Box>
        )}
        {safesToShow.length === 0 && !isManageMode ? (
          <NestedSafeInfo />
        ) : (
          <Box
            sx={{
              overflowX: 'hidden',
              overflowY: 'auto',
              flex: 1,
            }}
          >
            <NestedSafesList
              onClose={onClose}
              nestedSafes={safesToShow}
              isManageMode={isManageMode}
              onToggleSafe={toggleSafe}
              isSafeSelected={isSafeSelected}
            />
          </Box>
        )}
        {isManageMode ? (
          <Stack direction="row" spacing={2} mt={3}>
            <Button variant="outlined" onClick={handleCancel} fullWidth data-testid="cancel-manage-nested-safes">
              Cancel
            </Button>
            <Button variant="contained" onClick={handleSave} fullWidth data-testid="save-manage-nested-safes">
              Save
            </Button>
          </Stack>
        ) : (
          !hideCreationButton && (
            <Track {...NESTED_SAFE_EVENTS.ADD}>
              <CheckWallet>
                {(ok) => (
                  <Button
                    data-testid="add-nested-safe-button"
                    variant="contained"
                    sx={{ width: '100%', mt: 3 }}
                    onClick={onAdd}
                    disabled={!ok}
                  >
                    <SvgIcon component={AddIcon} inheritViewBox fontSize="small" />
                    Add Nested Safe
                  </Button>
                )}
              </CheckWallet>
            </Track>
          )
        )}
      </Stack>
    </Popover>
  )
}
