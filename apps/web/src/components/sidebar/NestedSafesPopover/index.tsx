import { SvgIcon, Popover, Button, Box, IconButton, Typography, Tooltip, CircularProgress } from '@mui/material'
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
import { NestedSafeIntro } from '@/components/sidebar/NestedSafeIntro'
import Track from '@/components/common/Track'
import { NESTED_SAFE_EVENTS } from '@/services/analytics/events/nested-safes'
import CheckWallet from '@/components/common/CheckWallet'
import { useManageNestedSafes } from '@/components/sidebar/NestedSafesList/useManageNestedSafes'
import { SimilarityConfirmDialog } from '@/components/sidebar/NestedSafesList/SimilarityConfirmDialog'
import type { NestedSafeWithStatus } from '@/hooks/useNestedSafesVisibility'

export function NestedSafesPopover({
  anchorEl,
  onClose,
  rawNestedSafes,
  allSafesWithStatus,
  visibleSafes,
  hasCompletedCuration,
  isLoading = false,
  hideCreationButton = false,
}: {
  anchorEl: HTMLElement | null
  onClose: () => void
  rawNestedSafes: string[]
  allSafesWithStatus: NestedSafeWithStatus[]
  visibleSafes: NestedSafeWithStatus[]
  hasCompletedCuration: boolean
  isLoading?: boolean
  hideCreationButton?: boolean
}): ReactElement {
  const { setTxFlow } = useContext(TxModalContext)
  // Track whether the user manually entered manage mode (vs auto-entered for first-time curation)
  const [userRequestedManage, setUserRequestedManage] = useState(false)
  // Track whether to show intro screen (only for first-time curation)
  const [showIntro, setShowIntro] = useState(true)
  const {
    toggleSafe,
    isSafeSelected,
    saveChanges,
    cancel,
    selectedCount,
    isFlagged,
    getSimilarAddresses,
    pendingConfirmation,
    confirmSimilarAddress,
    cancelSimilarAddress,
    groupedSafes,
  } = useManageNestedSafes(allSafesWithStatus)

  // Derive manage mode from curation state and user action
  // - If user clicked manage button, show manage mode
  // - If curation not complete and has nested safes AND user has reviewed intro, show manage mode
  // - Otherwise, show normal view
  const isFirstTimeCuration = !hasCompletedCuration && rawNestedSafes.length > 0
  const showIntroScreen = isFirstTimeCuration && showIntro
  const isManageMode = userRequestedManage || (isFirstTimeCuration && !showIntro)

  const onAdd = () => {
    setTxFlow(<CreateNestedSafeFlow />)
    onClose()
  }

  const handleManageClick = () => {
    setUserRequestedManage(true)
  }

  const handleReviewClick = () => {
    setShowIntro(false)
  }

  const handleSave = () => {
    saveChanges()
    setUserRequestedManage(false)
  }

  const handleCancel = () => {
    cancel()
    setUserRequestedManage(false)
    onClose()
  }

  // In manage mode, show all safes; otherwise show only curated (visible)
  const safesToShow = isManageMode ? allSafesWithStatus : visibleSafes

  // Calculate uncurated count for "+X more" indicator
  const uncuratedCount = rawNestedSafes.length - visibleSafes.length

  // Only manage mode prevents closing (intro screen can be dismissed to review later)
  const canClose = !isManageMode

  return (
    <Popover
      open={!!anchorEl}
      anchorEl={anchorEl}
      onClose={canClose ? onClose : undefined}
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
            // Narrow width for intro screen and normal view, wide for manage mode
            width: isManageMode ? 'min(750px, calc(100vw - 32px))' : 'min(420px, calc(100vw - 32px))',
            maxHeight: 'calc(100vh - 100px)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          },
        },
      }}
    >
      <ModalDialogTitle
        hideChainIndicator
        onClose={canClose ? onClose : undefined}
        sx={{ mt: -0.5, borderBottom: ({ palette }) => `1px solid ${palette.border.light}` }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
          <span>Nested Safes</span>
          {isManageMode ? (
            <Typography variant="body2" color="text.secondary">
              {selectedCount} {selectedCount === 1 ? 'safe' : 'safes'} selected
            </Typography>
          ) : (
            !showIntroScreen &&
            rawNestedSafes.length > 0 &&
            !isLoading && (
              <Tooltip title="Manage safes">
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
      <Box
        data-testid="nested-safe-list"
        p={3}
        pt={2}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          // Constrain max height to fit within popover (popover maxHeight minus header ~60px and padding ~40px)
          maxHeight: 'calc(100vh - 250px)',
        }}
      >
        {showIntroScreen ? (
          <NestedSafeIntro onReviewClick={handleReviewClick} />
        ) : (
          <>
            {isManageMode && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexShrink: 0 }}>
                Select which Nested Safes you want to see in your dashboard.
              </Typography>
            )}
            {isLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" py={4}>
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
                  isFlagged={isFlagged}
                  groupedSafes={isManageMode ? groupedSafes : undefined}
                />
              </Box>
            )}
            {!isManageMode && (
              <>
                {uncuratedCount > 0 && visibleSafes.length > 0 && (
                  <Track {...NESTED_SAFE_EVENTS.CLICK_MORE_INDICATOR}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        cursor: 'pointer',
                        textAlign: 'center',
                        mt: 2,
                        '&:hover': { textDecoration: 'underline' },
                      }}
                      onClick={handleManageClick}
                      data-testid="more-nested-safes-indicator"
                    >
                      +{uncuratedCount} more nested {uncuratedCount === 1 ? 'safe' : 'safes'} found
                    </Typography>
                  </Track>
                )}
                {!hideCreationButton && (
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
                          Add nested Safe
                        </Button>
                      )}
                    </CheckWallet>
                  </Track>
                )}
              </>
            )}
          </>
        )}
      </Box>

      {isManageMode && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: ({ palette }) => `1px solid ${palette.border.light}`,
            p: 2,
            px: 3,
            flexShrink: 0,
          }}
        >
          <Button variant="text" onClick={handleCancel} data-testid="cancel-manage-nested-safes">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={selectedCount === 0}
            data-testid="save-manage-nested-safes"
          >
            {isFirstTimeCuration ? 'Confirm selection' : 'Save'}
          </Button>
        </Box>
      )}

      {/* Similarity confirmation dialog */}
      {pendingConfirmation && (
        <SimilarityConfirmDialog
          address={pendingConfirmation}
          similarAddresses={getSimilarAddresses(pendingConfirmation)}
          onConfirm={confirmSimilarAddress}
          onCancel={cancelSimilarAddress}
        />
      )}
    </Popover>
  )
}
