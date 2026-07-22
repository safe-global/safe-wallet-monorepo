import { Popover, PopoverContent } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/utils/cn'
import { useContext, useState } from 'react'
import type { ReactElement } from 'react'

import css from './styles.module.css'
import {
  getIsFirstTimeCuration,
  getIsManageMode,
  getPopoverWidth,
  getSelectedCountLabel,
  getSafesToShow,
  getUncuratedCount,
  getUncuratedCountLabel,
} from './utils'
import AddIcon from '@/public/images/common/add.svg'
import SettingsIcon from '@/public/images/sidebar/settings.svg'
import { ModalDialogTitle } from '@/components/common/ModalDialog'
import DialogActions from '@/components/common/DialogActions'
import { CreateNestedSafeFlow } from '@/components/tx-flow/flows'
import { TxModalContext } from '@/components/tx-flow'
import { NestedSafesList } from '@/components/nested-safes/NestedSafesList'
import { NestedSafeInfo } from '@/components/nested-safes/NestedSafeInfo'
import { NestedSafeIntro } from '@/components/nested-safes/NestedSafeIntro'
import Track from '@/components/common/Track'
import { NESTED_SAFE_EVENTS } from '@/services/analytics/events/nested-safes'
import CheckWallet from '@/components/common/CheckWallet'
import { useManageNestedSafes } from '@/components/nested-safes/NestedSafesList/useManageNestedSafes'
import { SimilarityConfirmDialog } from '@/components/nested-safes/NestedSafesList/SimilarityConfirmDialog'
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
      <Typography variant="paragraph-small" color="muted">
        {getSelectedCountLabel(selectedCount)}
      </Typography>
    )
  }

  if (showIntroScreen || !hasNestedSafes || isLoading) return null

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onManageClick}
            className="ml-2"
            data-testid="manage-nested-safes-button"
          >
            <SettingsIcon className="size-4" />
          </Button>
        }
      />
      <TooltipContent>Manage safes</TooltipContent>
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
            variant="paragraph-small"
            color="muted"
            className="mt-4 block cursor-pointer text-center hover:underline"
            onClick={onManageClick}
            data-testid="more-nested-safes-indicator"
          >
            {getUncuratedCountLabel(uncuratedCount)}
          </Typography>
        </Track>
      )}
      {!hideCreationButton && (
        <Track {...NESTED_SAFE_EVENTS.ADD}>
          <CheckWallet>
            {(ok) => (
              <Button data-testid="add-nested-safe-button" className="mt-6 w-full" onClick={onAdd} disabled={!ok}>
                <AddIcon className="size-4" />
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
      <div className="flex items-center justify-center py-8">
        <Spinner className="size-8" />
      </div>
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
        <Typography variant="paragraph-small" color="muted" className="mb-4 block shrink-0">
          Select which Nested Safes you want to see in your dashboard.
        </Typography>
      )}
      <div className={css.scrollContainer}>
        <NestedSafesList
          onClose={onClose}
          safesWithStatus={safesToShow}
          isManageMode={isManageMode}
          onToggleSafe={toggleSafe}
          isSafeSelected={isSafeSelected}
          isFlagged={isFlagged}
          groupedSafes={isManageMode ? groupedSafes : undefined}
        />
      </div>
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
    <DialogActions
      className="shrink-0 border-t border-[var(--color-border-light)] px-6 py-4"
      onCancel={onCancel}
      cancelTestId="cancel-manage-nested-safes"
      confirmLabel={isFirstTimeCuration ? 'Confirm selection' : 'Save'}
      onConfirm={onSave}
      confirmDisabled={isFirstTimeCuration ? selectedCount === 0 : !hasChanges}
      confirmTestId="save-manage-nested-safes"
    />
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
  centered = false,
}: {
  anchorEl: HTMLElement | null
  onClose: () => void
  rawNestedSafes: string[]
  allSafesWithStatus: NestedSafeWithStatus[]
  visibleSafes: NestedSafeWithStatus[]
  hasCompletedCuration: boolean
  isLoading?: boolean
  hideCreationButton?: boolean
  centered?: boolean
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

  const isFirstTimeCuration = getIsFirstTimeCuration(hasCompletedCuration, rawNestedSafes)
  const showIntroScreen = isFirstTimeCuration && showIntro
  const isManageMode = getIsManageMode(userRequestedManage, isFirstTimeCuration, showIntro)

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

  const safesToShow = getSafesToShow(isManageMode, allSafesWithStatus, visibleSafes)
  const uncuratedCount = getUncuratedCount(rawNestedSafes, visibleSafes)
  const canClose = !isManageMode

  const centeredAnchor = () => ({
    getBoundingClientRect: () => new DOMRect(window.innerWidth / 2, window.innerHeight / 2, 0, 0),
  })

  return (
    <Popover
      open={!!anchorEl}
      onOpenChange={(open) => {
        if (!open && canClose) onClose()
      }}
    >
      <PopoverContent
        anchor={centered ? centeredAnchor : anchorEl}
        side="bottom"
        align="start"
        className={cn(
          // Size to content, but never past the viewport cap — the inner list scrolls once it hits
          // the cap, so a near-empty popover (e.g. the intro screen) stays compact while a long list
          // of nested safes grows to the maximum height. rounded-3xl (24px) matches the other header
          // popovers (WalletConnect, wallet, notifications).
          'flex h-auto max-h-[calc(100vh-100px)] flex-col gap-0 overflow-hidden rounded-3xl p-0',
          // Centered mode: pin to the viewport center (matches the previous MUI transformOrigin center/center)
          centered && 'fixed left-1/2 top-1/2 max-h-[calc(100vh-32px)] -translate-x-1/2 -translate-y-1/2',
        )}
        style={{ width: getPopoverWidth(isManageMode) }}
      >
        <ModalDialogTitle
          hideChainIndicator
          onClose={canClose ? onClose : undefined}
          className="-mt-1 border-b border-[var(--color-border-light)]"
        >
          <div className="flex w-full items-center justify-between">
            <span>Nested Safes</span>
            <PopoverHeaderAction
              isManageMode={isManageMode}
              selectedCount={selectedCount}
              showIntroScreen={showIntroScreen}
              hasNestedSafes={rawNestedSafes.length > 0}
              isLoading={isLoading}
              onManageClick={handleManageClick}
            />
          </div>
        </ModalDialogTitle>

        <div data-testid="nested-safe-list" className="flex min-h-0 flex-[1_1_auto] flex-col overflow-hidden p-6 pt-4">
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
        </div>

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
      </PopoverContent>
    </Popover>
  )
}
