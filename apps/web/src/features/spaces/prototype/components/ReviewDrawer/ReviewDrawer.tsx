import type { ReactNode } from 'react'
import { ChevronDown, ChevronUp, LockKeyhole } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { Input } from '@safe-global/views/components/ui/input'
import { Alert, AlertDescription, AlertSeverityIcon, AlertTitle } from '@safe-global/views/components/ui/alert'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@safe-global/views/components/ui/accordion'
import { Typography } from '@safe-global/views/components/ui/typography'
import { Kbd } from '@safe-global/views/components/ui/kbd'
import { Separator } from '@safe-global/views/components/ui/separator'
import { ICON_STROKE } from '@safe-global/views/components/common/iconStroke'
import { formatDateTime } from '@safe-global/utils/utils/date'
import { Drawer, DrawerHeader, DrawerTitle, DrawerBody, DrawerFooter, DrawerList } from '@/components/common/Drawer'
import Identicon from '@/components/common/Identicon'
import {
  getAccount,
  getAction,
  getAmountLabel,
  getConflicts,
  getCounterparty,
  getCreatedAt,
  getExecutionReason,
  getSignatureCount,
  getSignerSummary,
  getState,
  getStatusLabel,
  getStatusTone,
  getTransactionLabel,
  getTypeLabel,
  getWarnings,
  WARNING_DETAILS,
  WARNING_LABELS,
} from '../../services/model'
import type { PreviewAction } from '../../services/queue'
import type { Persona, Proposal } from '../../types'
import { CopyTransactionLink, ProposalAdvanced, ProposalDetails, SignerList } from '../ProposalDetails'
import { FeedbackButton, PENDING_QUEUE_FEEDBACK } from '../FeedbackButton'
import { TYPE_ICONS } from '../shared'

export type Replacement = { recipient: string; amount: string }

// Layout state lives with the page so stepping with J/K can keep it while opening a new row resets it.
export type ReviewLayout = {
  sections: string[]
  setSections: (sections: string[]) => void
  signersOpen: boolean
  setSignersOpen: (open: boolean) => void
  reject: boolean
  setReject: (reject: boolean) => void
  pendingAction: PreviewAction | null
  setPendingAction: (action: PreviewAction | null) => void
  replacement: Replacement | null
  setReplacement: (replacement: Replacement | null) => void
}

export type ReviewDrawerProps = {
  review: Proposal | null
  items: Proposal[]
  persona: Persona
  isMobile: boolean
  position: { index: number; count: number }
  layout: ReviewLayout
  feedback: string
  onStep: (offset: number) => void
  onClose: () => void
  onReview: (tx: Proposal) => void
  onAction: (action: PreviewAction) => void
  onProposeAlternative: (kind: 'cancellation' | 'replacement') => void
}

function PanelSection({
  value,
  title,
  meta,
  children,
}: {
  value: string
  title: string
  meta?: ReactNode
  children: ReactNode
}) {
  return (
    <AccordionItem value={value}>
      <AccordionTrigger>
        <span className="flex items-center gap-2">
          {title}
          {meta}
        </span>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-3 pb-3">{children}</div>
      </AccordionContent>
    </AccordionItem>
  )
}

function ReviewSummary({ tx, items, persona }: { tx: Proposal; items: Proposal[]; persona: Persona }) {
  const counterparty = getCounterparty(tx)
  const state = getState(tx, persona)
  const account = getAccount(tx)
  const conflicts = getConflicts(tx, items)
  return (
    <div role="group" aria-label="Transaction summary">
      <DrawerList
        mobileStack
        items={[
          {
            label: 'Safe',
            content: (
              <span className="flex min-w-0 items-center gap-2">
                <Identicon address={account.iconAddress} size={20} />
                <span className="truncate">
                  {account.name} · {account.network}
                </span>
              </span>
            ),
          },
          ...(counterparty ? [{ label: counterparty.label, content: counterparty.value }] : []),
          {
            label: 'Signatures',
            content: (
              <span className="tabular-nums">
                {getSignatureCount(tx)}/{account.threshold}
                {state.missing > 0 && <span className="text-muted-foreground"> · {getSignerSummary(tx, persona)}</span>}
              </span>
            ),
          },
          { label: 'Nonce', content: <span className="tabular-nums">#{tx.nonce}</span> },
          {
            label: 'Proposed',
            content: (
              <span className="tabular-nums">
                {formatDateTime(getCreatedAt(tx))}
                <span className="text-muted-foreground"> · {tx.age}</span>
              </span>
            ),
          },
          {
            label: 'Status',
            content: (
              <div className="flex flex-col md:items-end">
                <div className="flex flex-wrap items-center gap-1.5 md:justify-end">
                  <Badge variant={getStatusTone(tx, persona)}>{getStatusLabel(tx, persona)}</Badge>
                  {conflicts.length > 0 && <Badge variant="warning">{conflicts.length + 1} competing proposals</Badge>}
                  {tx.proposedBy && tx.signers.length === 0 && <Badge variant="outline">Proposal</Badge>}
                </div>
              </div>
            ),
          },
        ]}
      />
      <Alert variant="info" outlined={false} role="note" className="mt-3" data-testid="execution-reason">
        <AlertSeverityIcon variant="info" />
        <AlertDescription>{getExecutionReason(tx, persona, items)}</AlertDescription>
      </Alert>
    </div>
  )
}

const getSignerFootnote = (tx: Proposal, persona: Persona) => {
  const { missing } = getState(tx, persona)
  if (tx.kind.type === 'swap' && tx.kind.expired)
    return 'This order has expired. Reject this transaction and try again.'
  if (tx.proposedBy && tx.signers.length === 0)
    return 'This transaction was created by a proposer. Review it, then confirm or reject it.'
  if (missing && tx.kind.type === 'rejection')
    return 'This rejection can execute once the required approvals are collected.'
  return missing ? 'Can be executed once the threshold is reached.' : undefined
}

function StepButton({
  direction,
  disabled,
  onClick,
}: {
  direction: 'previous' | 'next'
  disabled: boolean
  onClick: () => void
}) {
  const previous = direction === 'previous'
  return (
    <Tooltip delay={150}>
      <TooltipTrigger
        render={
          <Button
            variant="surface"
            size="icon"
            aria-label={previous ? 'Previous transaction' : 'Next transaction'}
            disabled={disabled}
            onClick={onClick}
          />
        }
      >
        {previous ? <ChevronUp /> : <ChevronDown />}
      </TooltipTrigger>
      <TooltipContent>
        {previous ? 'Previous' : 'Next'} <Kbd>{previous ? 'K' : 'J'}</Kbd>
      </TooltipContent>
    </Tooltip>
  )
}

export function ReviewDrawer({
  review,
  items,
  persona,
  isMobile,
  position,
  layout,
  feedback,
  onStep,
  onClose,
  onReview,
  onAction,
  onProposeAlternative,
}: ReviewDrawerProps) {
  const reviewState = review ? getState(review, persona) : undefined
  const conflicts = review ? getConflicts(review, items) : []
  const signerFootnote = review ? getSignerFootnote(review, persona) : undefined
  const ReviewIcon = TYPE_ICONS[review ? getTypeLabel(review) : 'Send']
  const { pendingAction, replacement, reject } = layout
  const buttonSize = isMobile ? 'xl' : 'default'
  const canReplace = review ? persona === 'owner' && getAccount(review).owners.includes('Dev') : false

  return (
    <Drawer
      resizable
      mobileFullScreen
      open={!!review}
      onClose={onClose}
      ariaLabel={review ? getTransactionLabel(review) : undefined}
      headerActions={({ fullScreen }) => (
        <>
          {review && (
            <FeedbackButton
              {...PENDING_QUEUE_FEEDBACK}
              compact
              context={`${getTransactionLabel(review)} · ${getAccount(review).name} #${review.nonce}`}
            />
          )}
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
        <div className="flex min-w-0 flex-1 flex-col gap-4 pr-32 md:pr-46">
          {review && (
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-card text-foreground"
                aria-hidden="true"
              >
                <ReviewIcon className="size-4" strokeWidth={ICON_STROKE} />
              </span>
              <div className="min-w-0">
                <DrawerTitle size="lg">{getTypeLabel(review)}</DrawerTitle>
                <p className="truncate text-xs tabular-nums text-muted-foreground">{getAmountLabel(review)}</p>
              </div>
            </div>
          )}
        </div>
      </DrawerHeader>
      <DrawerBody>
        {review && (
          <div className="flex flex-col gap-3">
            {getWarnings(review).map((warning) => (
              <Alert key={warning} variant="warning" outlined={false}>
                <AlertSeverityIcon variant="warning" />
                <AlertTitle>{WARNING_LABELS[warning]}</AlertTitle>
                <AlertDescription>{WARNING_DETAILS[warning]}</AlertDescription>
              </Alert>
            ))}
            <Accordion multiple value={layout.sections} onValueChange={layout.setSections}>
              <PanelSection value="summary" title="Transaction summary">
                <ReviewSummary tx={review} items={items} persona={persona} />
              </PanelSection>
              {review.note && (
                <PanelSection value="note" title="Note">
                  <div className="space-y-2 rounded-lg bg-muted p-3">
                    <p className="text-sm leading-relaxed">{review.note.text}</p>
                    <p className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                      <LockKeyhole className="size-3" aria-hidden="true" />
                      {review.note.author} · {review.note.date} · Off-chain, not verified
                    </p>
                  </div>
                </PanelSection>
              )}
              <PanelSection value="details" title="Details">
                <ProposalDetails key={review.id} proposal={review} />
              </PanelSection>
              {reviewState?.waiting && (
                <PanelSection value="dependencies" title="Earlier transactions">
                  {Array.from(
                    { length: Math.min(review.nonce - getAccount(review).nextNonce, 10) },
                    (_, i) => getAccount(review).nextNonce + i,
                  ).map((nonce) => {
                    const dependencies = items.filter((tx) => tx.account === review.account && tx.nonce === nonce)
                    return (
                      <div key={nonce} className="rounded-lg bg-muted p-3">
                        <Typography variant="paragraph-small-medium">Nonce #{nonce}</Typography>
                        {dependencies.length ? (
                          dependencies.map((tx) => (
                            <button
                              key={tx.id}
                              className="mt-2 flex w-full items-center justify-between gap-2 text-left text-sm hover:underline"
                              onClick={() => onReview(tx)}
                            >
                              <span>{getTransactionLabel(tx)}</span>
                              <Badge variant="secondary">
                                {tx.signers.length}/{getAccount(tx).threshold}
                              </Badge>
                            </button>
                          ))
                        ) : (
                          <p className="mt-2 text-sm text-muted-foreground">
                            No proposal found in available data. Refresh the queue before treating this as a nonce gap.
                          </p>
                        )}
                      </div>
                    )
                  })}
                </PanelSection>
              )}
              {conflicts.length > 0 && (
                <PanelSection value="conflicts" title="Competing proposals">
                  <p className="text-sm text-muted-foreground">
                    These proposals use the same nonce. Executing one makes the others invalid.
                  </p>
                  {conflicts.map((tx) => (
                    <button
                      key={tx.id}
                      className="flex w-full items-center justify-between gap-2 rounded-lg bg-muted p-3 text-left text-sm hover:underline"
                      onClick={() => onReview(tx)}
                    >
                      <span>{getTransactionLabel(tx)}</span>
                      <Badge variant="secondary">{getAmountLabel(tx)}</Badge>
                    </button>
                  ))}
                </PanelSection>
              )}
              <PanelSection value="advanced" title="Advanced transaction data">
                <ProposalAdvanced key={review.id} proposal={review} />
              </PanelSection>
              {reject && (
                <PanelSection value="cancel" title="Replace or cancel">
                  <p className="text-sm text-muted-foreground">
                    A replacement or cancellation uses the same nonce. It needs signatures and on-chain execution before
                    the original proposal becomes invalid.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={!canReplace}
                    onClick={() => layout.setReplacement({ recipient: review.recipient, amount: review.amount })}
                  >
                    Replace with another transaction
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={!canReplace}
                    onClick={() => onProposeAlternative('cancellation')}
                  >
                    Propose on-chain cancellation
                  </Button>
                  {replacement && (
                    <div className="space-y-3 rounded-lg bg-muted p-3">
                      <p className="text-sm">
                        Review the replacement summary. This prototype does not build a signable transaction.
                      </p>
                      {(['recipient', 'amount'] as const).map((field) => (
                        <label key={field} className="block space-y-1 text-sm">
                          <span>{field === 'recipient' ? 'Recipient' : 'Amount'}</span>
                          <Input
                            value={replacement[field]}
                            onChange={(event) => layout.setReplacement({ ...replacement, [field]: event.target.value })}
                          />
                        </label>
                      ))}
                      <Button
                        disabled={!replacement.recipient.trim() || !replacement.amount.trim()}
                        onClick={() => onProposeAlternative('replacement')}
                      >
                        Propose replacement in preview
                      </Button>
                    </div>
                  )}
                </PanelSection>
              )}
            </Accordion>
          </div>
        )}
      </DrawerBody>
      <div className="@container shrink-0 border-t border-border bg-background" data-testid="proposal-fixed-footer">
        <DrawerFooter safeArea>
          {review && (
            <>
              <section aria-label="Signers">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-hidden="true"
                    className="flex cursor-pointer items-center gap-2 py-4 text-sm font-medium"
                    onClick={() => layout.setSignersOpen(!layout.signersOpen)}
                  >
                    Signers
                    <Badge variant="outline">
                      {getSignatureCount(review)} of {getAccount(review).threshold} required
                    </Badge>
                  </button>
                  <CopyTransactionLink proposal={review} />
                  <button
                    type="button"
                    aria-label="Signers"
                    aria-expanded={layout.signersOpen}
                    aria-controls="proposal-signers"
                    className="flex flex-1 cursor-pointer items-center justify-end gap-3 self-stretch rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    onClick={() => layout.setSignersOpen(!layout.signersOpen)}
                  >
                    {layout.signersOpen ? (
                      <ChevronUp className="size-4 text-muted-foreground" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
                    )}
                  </button>
                </div>
                <div
                  id="proposal-signers"
                  hidden={!layout.signersOpen}
                  className="max-h-[24vh] space-y-3 overflow-y-auto overscroll-contain pb-3"
                >
                  <SignerList proposal={review} persona={persona} />
                  {signerFootnote && (
                    <Alert
                      variant="subtle"
                      role="note"
                      className="*:data-[slot=alert-description]:text-muted-foreground"
                    >
                      <AlertDescription>{signerFootnote}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </section>
              <Separator className="mb-4" />
            </>
          )}
          {feedback && (
            <p role="status" className="mb-3 text-xs text-muted-foreground">
              {feedback}
            </p>
          )}
          {review && pendingAction && (
            <div className="mb-3 space-y-2 rounded-lg bg-muted p-3">
              <p className="text-sm">
                {pendingAction === 'sign'
                  ? 'Add your preview signature to this proposal.'
                  : 'Executing this proposal advances the nonce and invalidates competing proposals at the same nonce.'}
              </p>
              <p className="text-xs text-muted-foreground">Simulated action · no wallet request</p>
              <div className="flex flex-col gap-2 md:flex-row md:flex-wrap">
                <Button
                  variant="outline"
                  size={buttonSize}
                  className="w-full shrink-0 md:w-auto"
                  onClick={() => layout.setPendingAction(null)}
                >
                  Back to review
                </Button>
                {pendingAction === 'signAndExecute' && (
                  <Button
                    variant="outline"
                    size={buttonSize}
                    className="w-full shrink-0 md:w-auto"
                    onClick={() => onAction('sign')}
                  >
                    Sign only in preview
                  </Button>
                )}
                <Button size={buttonSize} className="w-full shrink-0 md:w-auto" onClick={() => onAction(pendingAction)}>
                  {pendingAction === 'sign'
                    ? 'Sign in preview'
                    : pendingAction === 'signAndExecute'
                      ? 'Sign and execute in preview'
                      : 'Execute in preview'}
                </Button>
              </div>
            </div>
          )}
          {review && reviewState && !pendingAction && (
            <div className="flex flex-col gap-2 md:flex-row @2xl:justify-end">
              <Button
                variant="outline"
                size={buttonSize}
                className="w-full shrink-0 md:w-auto"
                onClick={() => {
                  layout.setReject(!reject)
                  if (!reject) layout.setSections([...layout.sections, 'cancel'])
                }}
              >
                {reject ? 'Hide replace or cancel' : 'Replace or cancel'}
              </Button>
              <Button
                size={buttonSize}
                className="w-full shrink-0 md:w-auto md:flex-1 @2xl:min-w-56 @2xl:flex-none"
                disabled={!reviewState.ready && !reviewState.canSign}
                onClick={() =>
                  layout.setPendingAction(
                    reviewState.ready ? 'execute' : reviewState.finalSignature ? 'signAndExecute' : 'sign',
                  )
                }
              >
                {reviewState.ready || reviewState.canSign
                  ? getAction(review, persona)
                  : getStatusLabel(review, persona)}
              </Button>
            </div>
          )}
        </DrawerFooter>
      </div>
    </Drawer>
  )
}
