import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { Drawer, DrawerBody } from '@/components/common/Drawer'
import { getDetail, getHeadline, TYPE_HINTS } from '../../../services/columns'
import { getStatusHint } from '../../../services/actions'
import { getAccount, getConflicts, getTransactionLabel, getTypeLabel } from '../../../services/model'
import { getOwnerWallet } from '../../../services/nextSteps'
import { isSignerOf } from '../../../services/personas'
import { HintContent, StepsStatusChip, TYPE_ICONS } from '../../shared'
import { NonceMark } from '../../QueueTable/NonceCell'
import type { Hypernative } from '../../ScenarioBar'
import type { ReviewDrawerProps } from '../ReviewDrawer'
import { SharedDrawerHeader } from '../../Panel/SharedDrawerHeader'
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
import { ConfirmStep, StepsFooter } from './StepsFooter'
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
      header={({ fullScreen, toggleFullScreen, close }) =>
        review &&
        account && (
          <SharedDrawerHeader
            media={{
              kind: 'icon',
              icon: Icon,
              iconHint: <HintContent title={type} body={TYPE_HINTS[type]} />,
              title: getHeadline(review),
              subtitle: (
                <>
                  <NonceMark tx={review} persona={persona} competing={competing} />
                  <span className="min-w-0 truncate">
                    {account.name} · {account.network}
                    {detail ? ` · ${detail}` : ''}
                  </span>
                </>
              ),
            }}
            statusSlot={
              <Tooltip delay={150}>
                <TooltipTrigger
                  render={<span className="shrink-0" />}
                  aria-label={getStatusHint(review, items, persona)}
                >
                  <StepsStatusChip tx={review} persona={persona} />
                </TooltipTrigger>
                <TooltipContent>{getStatusHint(review, items, persona)}</TooltipContent>
              </Tooltip>
            }
            onPrevious={() => onStep(-1)}
            onNext={() => onStep(1)}
            hasPrevious={position.index > 0}
            hasNext={position.index >= 0 && position.index < position.count - 1}
            position={position}
            fullScreen={fullScreen}
            onToggleFullScreen={toggleFullScreen}
            onClose={close}
            padding={24}
          />
        )
      }
    >
      <DrawerBody>
        {review && (
          <div className="flex flex-col gap-6">
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
      {review && account && (
        <StepsFooter
          tx={review}
          items={items}
          persona={persona}
          layout={layout}
          remindedIds={remindedIds}
          feedback={feedback}
          onReview={onReview}
          onRemind={onRemind}
          onMenuAction={onMenuAction}
        >
          {layout.pendingAction && (
            <ConfirmStep
              pendingAction={layout.pendingAction}
              wallet={isSignerOf(account, persona) ? getOwnerWallet(account) : undefined}
              onBack={() => layout.setPendingAction(null)}
              onAction={onAction}
            />
          )}
        </StepsFooter>
      )}
    </Drawer>
  )
}
