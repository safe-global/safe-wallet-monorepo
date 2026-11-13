import type { ReactNode } from 'react'
import { Button } from '@safe-global/views/components/ui/button'
import { getMenuActions, getPrimaryAction, MENU_LABELS, type MenuAction } from '../../../services/actions'
import { getAccount } from '../../../services/model'
import { getNotSignerNote, getSignatureSummary, toSignatureRows } from '../../../services/signers'
import type { PreviewAction } from '../../../services/queue'
import type { Wallet } from '../../../services/nextSteps'
import type { Persona, Proposal } from '../../../types'
import { CopyTransactionLink } from '../../ProposalDetails'
import { SignatureGauge } from '../../QueueTable/SignatureGauge'
import { ActionRow, SignaturesFooter } from '../../Panel/SignaturesFooter'
import type { ReviewLayout } from '../ReviewDrawer'

export function ConfirmStep({
  pendingAction,
  wallet,
  conflicts = 0,
  nonce,
  onBack,
  onAction,
}: {
  pendingAction: PreviewAction
  wallet?: Wallet
  // Other transactions at this nonce. Executing makes them invalid.
  conflicts?: number
  nonce?: number
  onBack: () => void
  onAction: (action: PreviewAction) => void
}) {
  return (
    <div className="space-y-3 rounded-lg bg-muted p-3">
      <p className="text-sm">
        {pendingAction === 'sign'
          ? 'Add your preview signature to this proposal.'
          : pendingAction === 'signAndExecute'
            ? 'Yours is the last signature. Execute now, or sign and let anyone execute later.'
            : 'Executing advances the nonce.'}
      </p>
      {pendingAction !== 'sign' && conflicts > 0 && (
        <p className="text-sm text-warning-strong">
          Executing this makes {conflicts} other {conflicts === 1 ? 'transaction' : 'transactions'} at #{nonce} invalid.
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        {wallet && `You sign with ${wallet.name} · `}Simulated action · no wallet request
      </p>
      <div className="flex flex-col gap-2">
        <Button className="w-full" onClick={() => onAction(pendingAction)}>
          {pendingAction === 'sign'
            ? 'Sign in preview'
            : pendingAction === 'signAndExecute'
              ? 'Sign and execute in preview'
              : 'Execute in preview'}
        </Button>
        {pendingAction === 'signAndExecute' && (
          <Button variant="outline" className="w-full" onClick={() => onAction('sign')}>
            Sign only in preview
          </Button>
        )}
        <Button variant="ghost" className="w-full" onClick={onBack}>
          Back to review
        </Button>
      </div>
    </div>
  )
}

// The shared signatures footer with the queue's actions: same rules as the row, extras in "More actions".
export function StepsFooter({
  tx,
  items,
  persona,
  layout,
  remindedIds,
  feedback,
  onReview,
  onRemind,
  onMenuAction,
  children,
}: {
  tx: Proposal
  items: Proposal[]
  persona: Persona
  layout: ReviewLayout
  remindedIds: string[]
  feedback?: string
  onReview: (tx: Proposal) => void
  onRemind?: (tx: Proposal) => void
  onMenuAction?: (tx: Proposal, action: MenuAction) => void
  children?: ReactNode
}) {
  const account = getAccount(tx)
  const signed = tx.signers.filter((owner) => account.owners.includes(owner)).length
  const primary = getPrimaryAction(tx, items, persona, remindedIds)
  // The copy icon in the signatures header already copies the link.
  // The footer shows only what you can do, and not Remind when it's already the main button.
  const menu = getMenuActions(tx, items, persona).filter(
    (action) => action !== 'copyLink' && !(action === 'remind' && primary.kind === 'remind'),
  )
  const menuLabel = (action: MenuAction) =>
    action === 'remind' && remindedIds.includes(tx.id) ? 'Remind signers again' : MENU_LABELS[action]
  const run = () => {
    if (primary.kind === 'flow') layout.setPendingAction(primary.flow)
    else if (primary.kind === 'goTo') onReview(primary.target)
    else if (primary.kind === 'remind') onRemind?.(primary.target)
  }
  const secondaryVariant: 'outline' | 'ghost' = primary.kind === 'review' ? 'outline' : 'ghost'
  const secondary =
    menu.length === 1
      ? { label: menuLabel(menu[0]), variant: secondaryVariant, onClick: () => onMenuAction?.(tx, menu[0]) }
      : menu.length > 1
        ? {
            label: 'More actions',
            variant: secondaryVariant,
            items: menu.map((action) => ({ label: menuLabel(action), onClick: () => onMenuAction?.(tx, action) })),
          }
        : undefined
  return (
    <SignaturesFooter
      signed={signed}
      required={account.threshold}
      summary={getSignatureSummary(tx).split(' · ')[1]}
      gauge={<SignatureGauge count={signed} threshold={account.threshold} />}
      rows={toSignatureRows(tx, persona)}
      chainId={account.chainId}
      open={layout.signersOpen}
      onOpenChange={layout.setSignersOpen}
      onNotify={signed < account.threshold && onRemind ? () => onRemind(tx) : undefined}
      notified={remindedIds.includes(tx.id)}
      note={getNotSignerNote(tx, persona)}
      copyLink={<CopyTransactionLink proposal={tx} />}
      padding={24}
    >
      {feedback && (
        <p role="status" className="mb-3 text-center text-xs text-muted-foreground">
          {feedback}
        </p>
      )}
      {children ?? (
        <ActionRow
          hint={'hint' in primary ? primary.hint : undefined}
          primary={primary.kind !== 'review' ? { label: primary.label, onClick: run } : undefined}
          secondary={secondary}
        />
      )}
    </SignaturesFooter>
  )
}
