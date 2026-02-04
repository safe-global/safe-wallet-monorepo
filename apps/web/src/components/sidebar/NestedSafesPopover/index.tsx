import { SvgIcon, Popover, Button, Box, Stack, IconButton, Typography, Tooltip, CircularProgress } from '@mui/material'
import { useContext, useState } from 'react'
import type { ReactElement } from 'react'

import css from './styles.module.css'
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
import type { NestedSafeWithStatus } from '@/hooks/useNestedSafesVisibility'

export function NestedSafesPopover({
  anchorEl,
  onClose,
  rawNestedSafes,
  allSafesWithStatus,
  visibleSafes,
  isLoading = false,
  hideCreationButton = false,
}: {
  anchorEl: HTMLElement | null
  onClose: () => void
  rawNestedSafes: string[]
  allSafesWithStatus: NestedSafeWithStatus[]
  visibleSafes: NestedSafeWithStatus[]
  isLoading?: boolean
  hideCreationButton?: boolean
}): ReactElement {
  const { setTxFlow } = useContext(TxModalContext)
  const [isManageMode, setIsManageMode] = useState(false)
  const { toggleSafe, isSafeSelected, saveChanges, cancel, selectedCount } = useManageNestedSafes(allSafesWithStatus)

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

  // In manage mode, show all safes; otherwise show only visible
  const safesToShow = isManageMode ? allSafesWithStatus : visibleSafes

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
          {isManageMode ? (
            <Typography variant="body2" color="text.secondary">
              {selectedCount} {selectedCount === 1 ? 'safe' : 'safes'} selected to hide
            </Typography>
          ) : (
            rawNestedSafes.length > 0 &&
            !isLoading && (
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
            )
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
        {isLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" flex={1} py={4}>
            <CircularProgress size={32} />
          </Box>
        ) : safesToShow.length === 0 && !isManageMode ? (
          <NestedSafeInfo />
        ) : (
          <Box className={css.scrollContainer}>
            <NestedSafesList
              onClose={onClose}
              safesWithStatus={safesToShow}
              isManageMode={isManageMode}
              onToggleSafe={toggleSafe}
              isSafeSelected={isSafeSelected}
            />
          </Box>
        )}
        {!isLoading && rawNestedSafes.length > visibleSafes.length && !isManageMode && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
            {rawNestedSafes.length - visibleSafes.length}{' '}
            {rawNestedSafes.length - visibleSafes.length === 1 ? 'safe' : 'safes'} hidden
          </Typography>
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
