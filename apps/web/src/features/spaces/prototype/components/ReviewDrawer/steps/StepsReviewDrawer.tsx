import { ChevronsDownUp, ChevronsUpDown } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { Drawer, DrawerBody } from '@/components/common/Drawer'
import { getDetail, getHeadline, TYPE_HINTS } from '../../../services/columns'
import { getStatusHint } from '../../../services/actions'
import { getAccount, getConflicts, getState, getTransactionLabel, getTypeLabel } from '../../../services/model'
import { getOwnerWallet } from '../../../services/nextSteps'
import { isSignerOf } from '../../../services/personas'
import { HintContent, StatusChip, StepsStatusChip, TYPE_ICONS } from '../../shared'
import type { Hypernative } from '../../ScenarioBar'
import type { ReviewDrawerProps } from '../ReviewDrawer'
import { SharedDrawerHeader } from '../../Panel/SharedDrawerHeader'
import {
  ChangeSection,
  ConflictsSection,
  SectionsContext,
  NoteSection,
  SecuritySection,
  StatusAlerts,
  SummarySection,
  TransactionDataSection,
  WhatItDoesSection,
} from './StepsSections'
import { ConfirmStep, StepsFooter } from './StepsFooter'

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
  const account = review ? getAccount(review) : undefined
  const competing = review ? getConflicts(review, items).length : 0
  const detail = review ? getDetail(review) : undefined
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
              subtitle: detail && <span className="min-w-0 truncate">{detail}</span>,
            }}
            onPrevious={() => onStep(-1)}
            onNext={() => onStep(1)}
            hasPrevious={position.index > 0}
            hasNext={position.index >= 0 && position.index < position.count - 1}
            position={position}
            fullScreen={fullScreen}
            onToggleFullScreen={toggleFullScreen}
            onClose={close}
            padding={24}
            extraActions={
              layout.toggleAllSections
                ? [
                    {
                      id: 'sections',
                      label: layout.sectionsMode === 'expanded' ? 'Collapse all sections' : 'Expand all sections',
                      icon: layout.sectionsMode === 'expanded' ? <ChevronsDownUp /> : <ChevronsUpDown />,
                      onClick: layout.toggleAllSections,
                      shortcut: 'E',
                    },
                  ]
                : undefined
            }
          />
        )
      }
    >
      <DrawerBody>
        {review && (
          // Keyed so each transaction starts from the defaults, or from "Expand all" while stepping.
          <SectionsContext.Provider
            key={review.id}
            value={{ mode: layout.sectionsMode ?? 'default', version: layout.sectionsVersion ?? 0 }}
          >
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2 empty:hidden">
                <StatusAlerts tx={review} items={items} persona={persona} />
              </div>
              <ChangeSection tx={review} layout={layout} onProposeAlternative={onProposeAlternative} />
              <SummarySection
                tx={review}
                // Blocked shows on "Conflicts and checks". Here, a blocked transaction you can still sign says so.
                status={
                  getState(review, persona).waiting ? (
                    getState(review, persona).canSign && (
                      <Tooltip delay={150}>
                        <TooltipTrigger render={<span className="shrink-0" />}>
                          <StatusChip tone="success">Sign ahead</StatusChip>
                        </TooltipTrigger>
                        <TooltipContent>
                          You can sign now. It executes after #{getAccount(review).nextNonce}.
                        </TooltipContent>
                      </Tooltip>
                    )
                  ) : (
                    <Tooltip delay={150}>
                      <TooltipTrigger
                        render={<span className="shrink-0" />}
                        aria-label={getStatusHint(review, items, persona)}
                      >
                        <StepsStatusChip tx={review} persona={persona} />
                      </TooltipTrigger>
                      <TooltipContent>{getStatusHint(review, items, persona)}</TooltipContent>
                    </Tooltip>
                  )
                }
              />
              <ConflictsSection tx={review} items={items} persona={persona} onReview={onReview} />
              <SecuritySection tx={review} hypernative={hypernative} />
              <WhatItDoesSection tx={review} />
              <NoteSection tx={review} />
              <TransactionDataSection tx={review} open={showTechnical} onToggle={() => onToggleTechnical?.()} />
            </div>
          </SectionsContext.Provider>
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
              conflicts={competing}
              nonce={review.nonce}
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
