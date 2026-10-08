import { Popover, PopoverContent } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/utils/cn'
import type { ComponentProps, ReactElement, ReactNode } from 'react'
import css from './styles.module.css'
import {
  getPopoverWidth,
  getSelectedCountLabel,
  getUncuratedCountLabel,
} from '@views/components/nested-safes/NestedSafesPopover/utils'
import AddIcon from '@/public/images/common/add.svg'
import SettingsIcon from '@/public/images/sidebar/settings.svg'
import { NestedSafeInfo } from '@/components/nested-safes/NestedSafeInfo'
import { NestedSafeIntro } from '@/components/nested-safes/NestedSafeIntro'
import Track from '@/components/common/Track'
import { NESTED_SAFE_EVENTS } from '@/services/analytics/events/nested-safes'

export type ModalDialogTitleSlotProps = {
  hideChainIndicator: boolean
  onClose?: () => void
  className: string
  children: ReactNode
}

export type DialogActionsSlotProps = {
  className: string
  onCancel: () => void
  cancelTestId: string
  confirmLabel: string
  onConfirm: () => void
  confirmDisabled: boolean
  confirmTestId: string
}

type RenderCheckWallet = (render: (ok: boolean) => ReactElement) => ReactElement

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
            aria-label="Manage nested Safes"
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
  renderCheckWallet,
}: {
  uncuratedCount: number
  hasVisibleSafes: boolean
  hideCreationButton: boolean
  onManageClick: () => void
  onAdd: () => void
  renderCheckWallet: RenderCheckWallet
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
          {renderCheckWallet((ok) => (
            <Button data-testid="add-nested-safe-button" className="mt-6 w-full" onClick={onAdd} disabled={!ok}>
              <AddIcon className="size-4" />
              Add nested Safe
            </Button>
          ))}
        </Track>
      )}
    </>
  )
}

function PopoverBody({
  isLoading,
  isManageMode,
  safesCount,
  nestedSafesList,
  uncuratedCount,
  hasVisibleSafes,
  hideCreationButton,
  onManageClick,
  onAdd,
  renderCheckWallet,
}: {
  isLoading: boolean
  isManageMode: boolean
  safesCount: number
  nestedSafesList: ReactNode
  uncuratedCount: number
  hasVisibleSafes: boolean
  hideCreationButton: boolean
  onManageClick: () => void
  onAdd: () => void
  renderCheckWallet: RenderCheckWallet
}): ReactElement {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner className="size-8" />
      </div>
    )
  }

  if (safesCount === 0 && !isManageMode) {
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
            renderCheckWallet={renderCheckWallet}
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
      <div className={css.scrollContainer}>{nestedSafesList}</div>
      {!isManageMode && (
        <NormalModeActions
          uncuratedCount={uncuratedCount}
          hasVisibleSafes={hasVisibleSafes}
          hideCreationButton={hideCreationButton}
          onManageClick={onManageClick}
          onAdd={onAdd}
          renderCheckWallet={renderCheckWallet}
        />
      )}
    </>
  )
}

export type NestedSafesPopoverViewProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  anchor: ComponentProps<typeof PopoverContent>['anchor']
  centered: boolean
  canClose: boolean
  onClose: () => void
  isManageMode: boolean
  isFirstTimeCuration: boolean
  showIntroScreen: boolean
  onReviewIntro: () => void
  selectedCount: number
  hasChanges: boolean
  hasNestedSafes: boolean
  isLoading: boolean
  safesCount: number
  nestedSafesList: ReactNode
  uncuratedCount: number
  hasVisibleSafes: boolean
  hideCreationButton: boolean
  onManageClick: () => void
  onAdd: () => void
  onSave: () => void
  onCancel: () => void
  similarityDialog: ReactNode
  renderModalDialogTitle: (props: ModalDialogTitleSlotProps) => ReactNode
  renderDialogActions: (props: DialogActionsSlotProps) => ReactNode
  renderCheckWallet: RenderCheckWallet
}

export function NestedSafesPopoverView({
  open,
  onOpenChange,
  anchor,
  centered,
  canClose,
  onClose,
  isManageMode,
  isFirstTimeCuration,
  showIntroScreen,
  onReviewIntro,
  selectedCount,
  hasChanges,
  hasNestedSafes,
  isLoading,
  safesCount,
  nestedSafesList,
  uncuratedCount,
  hasVisibleSafes,
  hideCreationButton,
  onManageClick,
  onAdd,
  onSave,
  onCancel,
  similarityDialog,
  renderModalDialogTitle,
  renderDialogActions,
  renderCheckWallet,
}: NestedSafesPopoverViewProps): ReactElement {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverContent
        showBackdrop
        anchor={anchor}
        side="bottom"
        align="start"
        className={cn(
          // Sizes to content up to the viewport cap, then the inner list scrolls; rounded-3xl matches other header popovers
          'flex h-auto max-h-[calc(100vh-100px)] flex-col gap-0 overflow-hidden rounded-3xl p-0',
          // Centered mode: pin to the viewport center (matches the previous MUI transformOrigin center/center)
          centered && 'fixed left-1/2 top-1/2 max-h-[calc(100vh-32px)] -translate-x-1/2 -translate-y-1/2',
        )}
        style={{ width: getPopoverWidth(isManageMode) }}
      >
        {renderModalDialogTitle({
          hideChainIndicator: true,
          onClose: canClose ? onClose : undefined,
          className: '-mt-1 border-b border-[var(--color-border-light)]',
          children: (
            <div className="flex w-full items-center justify-between">
              <span>Nested Safes</span>
              <PopoverHeaderAction
                isManageMode={isManageMode}
                selectedCount={selectedCount}
                showIntroScreen={showIntroScreen}
                hasNestedSafes={hasNestedSafes}
                isLoading={isLoading}
                onManageClick={onManageClick}
              />
            </div>
          ),
        })}

        <div data-testid="nested-safe-list" className="flex min-h-0 flex-[1_1_auto] flex-col overflow-hidden p-6 pt-4">
          {showIntroScreen ? (
            <NestedSafeIntro onReviewClick={onReviewIntro} />
          ) : (
            <PopoverBody
              isLoading={isLoading}
              isManageMode={isManageMode}
              safesCount={safesCount}
              nestedSafesList={nestedSafesList}
              uncuratedCount={uncuratedCount}
              hasVisibleSafes={hasVisibleSafes}
              hideCreationButton={hideCreationButton}
              onManageClick={onManageClick}
              onAdd={onAdd}
              renderCheckWallet={renderCheckWallet}
            />
          )}
        </div>

        {isManageMode &&
          renderDialogActions({
            className: 'shrink-0 border-t border-[var(--color-border-light)] px-6 py-4',
            onCancel,
            cancelTestId: 'cancel-manage-nested-safes',
            confirmLabel: isFirstTimeCuration ? 'Confirm selection' : 'Save',
            onConfirm: onSave,
            confirmDisabled: isFirstTimeCuration ? selectedCount === 0 : !hasChanges,
            confirmTestId: 'save-manage-nested-safes',
          })}

        {similarityDialog}
      </PopoverContent>
    </Popover>
  )
}
