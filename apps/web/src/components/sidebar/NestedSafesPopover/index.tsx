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

function PopoverHeaderAction({
  isManageMode,
  selectedCount,
  showIntroScreen,
  hasNestedSafes,
  isLoading,
  onManageClick,
}: {
  isManageMode: boolean
  selectedCount: number
  showIntroScreen: boolean
  hasNestedSafes: boolean
  isLoading: boolean
  onManageClick: () => void
}): ReactElement | null {
  if (isManageMode) {
    return (
      <Typography variant="body2" color="text.secondary">
        {selectedCount} {selectedCount === 1 ? 'safe' : 'safes'} selected
      </Typography>
    )
  }

  if (showIntroScreen || !hasNestedSafes || isLoading) return null

  return (
    <Tooltip title="Manage safes">
      <IconButton onClick={onManageClick} size="small" sx={{ ml: 1 }} data-testid="manage-nested-safes-button">
        <SvgIcon component={SettingsIcon} inheritViewBox fontSize="small" />
      </IconButton>
    </Tooltip>
  )
}

function NormalModeActions({
  uncuratedCount,
  hasVisibleSafes,
  hideCreationButton,
  onManageClick,
  onAdd,
}: {
  uncuratedCount: number
  hasVisibleSafes: boolean
  hideCreationButton: boolean
  onManageClick: () => void
  onAdd: () => void
}): ReactElement {
  return (
    <>
      {uncuratedCount > 0 && hasVisibleSafes && (
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
            onClick={onManageClick}
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
  )
}

function PopoverBody({
  isLoading,
  isManageMode,
  safesToShow,
  onClose,
  toggleSafe,
  isSafeSelected,
  isFlagged,
  groupedSafes,
  uncuratedCount,
  hasVisibleSafes,
  hideCreationButton,
  onManageClick,
  onAdd,
}: {
  isLoading: boolean
  isManageMode: boolean
  safesToShow: NestedSafeWithStatus[]
  onClose: () => void
  toggleSafe: (address: string) => void
  isSafeSelected: (address: string) => boolean
  isFlagged: (address: string) => boolean
  groupedSafes: ReturnType<typeof useManageNestedSafes>['groupedSafes']
  uncuratedCount: number
  hasVisibleSafes: boolean
  hideCreationButton: boolean
  onManageClick: () => void
  onAdd: () => void
}): ReactElement {
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" py={4}>
        <CircularProgress size={32} />
      </Box>
    )
  }

  if (safesToShow.length === 0 && !isManageMode) {
    return (
      <>
        <NestedSafeInfo />
        {!hideCreationButton && (
          <NormalModeActions
            uncuratedCount={0}
            hasVisibleSafes={false}
            hideCreationButton={hideCreationButton}
            onManageClick={onManageClick}
            onAdd={onAdd}
          />
        )}
      </>
    )
  }

  return (
    <>
      {isManageMode && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexShrink: 0 }}>
          Select which Nested Safes you want to see in your dashboard.
        </Typography>
      )}
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
      {!isManageMode && (
        <NormalModeActions
          uncuratedCount={uncuratedCount}
          hasVisibleSafes={hasVisibleSafes}
          hideCreationButton={hideCreationButton}
          onManageClick={onManageClick}
          onAdd={onAdd}
        />
      )}
    </>
  )
}

function ManageModeFooter({
  isFirstTimeCuration,
  selectedCount,
  hasChanges,
  onSave,
  onCancel,
}: {
  isFirstTimeCuration: boolean
  selectedCount: number
  hasChanges: boolean
  onSave: () => void
  onCancel: () => void
}): ReactElement {
  return (
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
      <Button variant="text" onClick={onCancel} data-testid="cancel-manage-nested-safes">
        Cancel
      </Button>
      <Button
        variant="contained"
        onClick={onSave}
        disabled={isFirstTimeCuration ? selectedCount === 0 : !hasChanges}
        data-testid="save-manage-nested-safes"
      >
        {isFirstTimeCuration ? 'Confirm selection' : 'Save'}
      </Button>
    </Box>
  )
}

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
  const [userRequestedManage, setUserRequestedManage] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const {
    toggleSafe,
    isSafeSelected,
    saveChanges,
    cancel,
    selectedCount,
    hasChanges,
    isFlagged,
    getSimilarAddresses,
    pendingConfirmation,
    confirmSimilarAddress,
    cancelSimilarAddress,
    groupedSafes,
  } = useManageNestedSafes(allSafesWithStatus)

  const isFirstTimeCuration = !hasCompletedCuration && rawNestedSafes.length > 0
  const showIntroScreen = isFirstTimeCuration && showIntro
  const isManageMode = userRequestedManage || (isFirstTimeCuration && !showIntro)

  const onAdd = () => {
    setTxFlow(<CreateNestedSafeFlow />)
    onClose()
  }

  const handleManageClick = () => setUserRequestedManage(true)

  const handleSave = () => {
    saveChanges()
    setUserRequestedManage(false)
  }

  const handleCancel = () => {
    cancel()
    setUserRequestedManage(false)
    onClose()
  }

  const safesToShow = isManageMode ? allSafesWithStatus : visibleSafes
  const uncuratedCount = rawNestedSafes.length - visibleSafes.length
  const canClose = !isManageMode

  return (
    <Popover
      open={!!anchorEl}
      anchorEl={anchorEl}
      onClose={canClose ? onClose : undefined}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      slotProps={{
        paper: {
          sx: {
            width: isManageMode ? 'min(750px, calc(100vw - 32px))' : 'min(420px, calc(100vw - 32px))',
            height: 'calc(100vh - 100px)',
            maxHeight: 'calc(100vh - 100px)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            '@media (max-width: 599.95px)': {
              top: '16px !important',
              left: '16px !important',
              height: 'calc(100vh - 32px)',
              maxHeight: 'none',
            },
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
          <PopoverHeaderAction
            isManageMode={isManageMode}
            selectedCount={selectedCount}
            showIntroScreen={showIntroScreen}
            hasNestedSafes={rawNestedSafes.length > 0}
            isLoading={isLoading}
            onManageClick={handleManageClick}
          />
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
          flex: '1 1 auto',
          minHeight: 0,
        }}
      >
        {showIntroScreen ? (
          <NestedSafeIntro onReviewClick={() => setShowIntro(false)} />
        ) : (
          <PopoverBody
            isLoading={isLoading}
            isManageMode={isManageMode}
            safesToShow={safesToShow}
            onClose={onClose}
            toggleSafe={toggleSafe}
            isSafeSelected={isSafeSelected}
            isFlagged={isFlagged}
            groupedSafes={groupedSafes}
            uncuratedCount={uncuratedCount}
            hasVisibleSafes={visibleSafes.length > 0}
            hideCreationButton={hideCreationButton}
            onManageClick={handleManageClick}
            onAdd={onAdd}
          />
        )}
      </Box>

      {isManageMode && (
        <ManageModeFooter
          isFirstTimeCuration={isFirstTimeCuration}
          selectedCount={selectedCount}
          hasChanges={hasChanges}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

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
