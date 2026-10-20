import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { ICON_STROKE } from '@safe-global/views/components/common/iconStroke'
import { Drawer, DrawerBody, DrawerFooter, DrawerHeader, DrawerSubtitle, DrawerTitle } from '@/components/common/Drawer'
import { getDetail, getHeadline, TYPE_HINTS } from '../../../services/columns'
import { getStatusHint } from '../../../services/actions'
import { getAccount, getConflicts, getTransactionLabel, getTypeLabel } from '../../../services/model'
import { HINT_CLASS, HintContent, StepsStatusChip, TYPE_ICONS } from '../../shared'
import { NonceMark } from '../../QueueTable/NonceCell'
import type { Hypernative } from '../../ScenarioBar'
import type { ReviewDrawerProps } from '../ReviewDrawer'
import { StepButton } from '../StepButton'
import {
  ChangeSection,
  NoteSection,
  QueueContextSection,
  SecuritySection,
  StatusAlerts,
  SummarySection,
  TransactionDataSection,
  WhatItDoesSection,
} from './StepsSections'
import { ConfirmStep, SignersPanel, StepsActions } from './StepsFooter'
import { FlowBlock } from './FlowBlock'

// Next steps drawer: same title, status and actions as the queue row.
export function StepsReviewDrawer({
  review,
  items,
  persona,
  position,
  layout,
  feedback,
  onStep,
  onClose,
  onReview,
  onAction,
  onProposeAlternative,
  remindedIds = [],
  onRemind,
  onMenuAction,
  hypernative = 'in',
  showTechnical = false,
  onToggleTechnical,
}: ReviewDrawerProps & { hypernative?: Hypernative; showTechnical?: boolean; onToggleTechnical?: () => void }) {
  const type = review ? getTypeLabel(review) : 'Send'
  const Icon = TYPE_ICONS[type]
  const detail = review ? getDetail(review) : undefined
  const account = review ? getAccount(review) : undefined
  const competing = review ? getConflicts(review, items).length : 0
  return (
    <Drawer
      resizable
      mobileFullScreen
      open={!!review}
      onClose={onClose}
      ariaLabel={review ? getTransactionLabel(review) : undefined}
      headerActions={({ fullScreen }) => (
        <>
          <StepButton direction="previous" disabled={position.index <= 0} onClick={() => onStep(-1)} />
          <StepButton
            direction="next"
            disabled={position.index < 0 || position.index >= position.count - 1}
            onClick={() => onStep(1)}
          />
          <span
            className={fullScreen ? 'text-xs tabular-nums text-muted-foreground max-md:sr-only' : 'sr-only'}
            aria-live="polite"
          >
            {position.index >= 0 && `${position.index + 1} of ${position.count}`}
          </span>
        </>
      )}
    >
      <DrawerHeader>
        {review && account && (
          <div className="flex min-w-0 flex-1 items-center gap-3 pr-22 md:pr-36">
            <Tooltip delay={150}>
              <TooltipTrigger
                render={
                  <span
                    className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-card"
                    role="img"
                    aria-label={`${type}. ${TYPE_HINTS[type]}`}
                  />
                }
              >
                <Icon className="size-5" strokeWidth={ICON_STROKE} aria-hidden="true" />
              </TooltipTrigger>
              <TooltipContent className={HINT_CLASS}>
                <HintContent title={type} body={TYPE_HINTS[type]} />
              </TooltipContent>
            </Tooltip>
            <DrawerTitle size="lg">{getHeadline(review)}</DrawerTitle>
          </div>
        )}
      </DrawerHeader>
      <DrawerBody>
        {review && (
          <div className="flex flex-col gap-6">
            <div className="flex min-w-0 items-center gap-2">
              <div className="min-w-0 flex-1 overflow-hidden">
                <DrawerSubtitle>
                  <NonceMark tx={review} persona={persona} competing={competing} />
                  <span className="min-w-0 truncate">
                    {account?.name} · {account?.network}
                    {detail ? ` · ${detail}` : ''}
                  </span>
                </DrawerSubtitle>
              </div>
              <Tooltip delay={150}>
                <TooltipTrigger
                  render={<span className="ml-auto shrink-0" />}
                  aria-label={getStatusHint(review, items, persona)}
                >
                  <StepsStatusChip tx={review} persona={persona} />
                </TooltipTrigger>
                <TooltipContent>{getStatusHint(review, items, persona)}</TooltipContent>
              </Tooltip>
            </div>
            <div className="flex flex-col gap-2 empty:hidden">
              <StatusAlerts tx={review} items={items} persona={persona} />
            </div>
            <FlowBlock tx={review} />
            <ChangeSection tx={review} layout={layout} onProposeAlternative={onProposeAlternative} />
            <SummarySection tx={review} />
            <WhatItDoesSection key={review.id} tx={review} />
            <NoteSection tx={review} />
            <QueueContextSection tx={review} items={items} persona={persona} onReview={onReview} />
            <SecuritySection tx={review} hypernative={hypernative} />
            <TransactionDataSection tx={review} open={showTechnical} onToggle={() => onToggleTechnical?.()} />
          </div>
        )}
      </DrawerBody>
      <div className="shrink-0 border-t border-border bg-background" data-testid="proposal-fixed-footer">
        <DrawerFooter safeArea>
          {review && <SignersPanel tx={review} persona={persona} layout={layout} />}
          {feedback && (
            <p role="status" className="mb-3 text-center text-xs text-muted-foreground">
              {feedback}
            </p>
          )}
          {review && layout.pendingAction && (
            <ConfirmStep
              pendingAction={layout.pendingAction}
              onBack={() => layout.setPendingAction(null)}
              onAction={onAction}
            />
          )}
          {review && !layout.pendingAction && (
            <StepsActions
              tx={review}
              items={items}
              persona={persona}
              layout={layout}
              remindedIds={remindedIds}
              onReview={onReview}
              onRemind={onRemind}
              onMenuAction={onMenuAction}
            />
          )}
        </DrawerFooter>
      </div>
    </Drawer>
  )
}
