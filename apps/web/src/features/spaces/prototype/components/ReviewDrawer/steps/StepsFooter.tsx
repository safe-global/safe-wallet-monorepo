import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@safe-global/views/components/ui/dropdown-menu'
import { DrawerActions } from '@safe-global/views/components/common/Drawer/components/DrawerActions'
import { DrawerFooter } from '@safe-global/views/components/common/Drawer/components/DrawerFooter'
import {
  DrawerSignatures,
  type DrawerSignatureRow,
} from '@safe-global/views/components/common/Drawer/components/DrawerSignatures'
import { getMenuActions, getPrimaryAction, MENU_LABELS, type MenuAction } from '../../../services/actions'
import { getAccount } from '../../../services/model'
import { getNotSignerNote, getSignatureSummary, toSignatureRows } from '../../../services/signers'
import type { PreviewAction } from '../../../services/queue'
import type { Wallet } from '../../../services/nextSteps'
import type { Persona, Proposal } from '../../../types'
import { CopyTransactionLink } from '../../ProposalDetails'
import type { ReviewLayout } from '../ReviewDrawer'
import { IdentityRow } from './IdentityRow'

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
    <>
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
            Executing this makes {conflicts} other {conflicts === 1 ? 'transaction' : 'transactions'} at #{nonce}{' '}
            invalid.
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {wallet && `You sign with ${wallet.name} · `}Simulated action · no wallet request
        </p>
      </div>
      {pendingAction === 'signAndExecute' && (
        <Button variant="outline" className="w-full" onClick={() => onAction('sign')}>
          Sign only in preview
        </Button>
      )}
      <DrawerActions
        secondary={
          <Button variant="ghost" onClick={onBack}>
            Back to review
          </Button>
        }
        primary={
          <Button onClick={() => onAction(pendingAction)}>
            {pendingAction === 'sign'
              ? 'Sign in preview'
              : pendingAction === 'signAndExecute'
                ? 'Sign and execute in preview'
                : 'Execute in preview'}
          </Button>
        }
      />
    </>
  )
}

// The queue's actions under the signatures: same rules as the row, extras in "More actions".
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
  const secondaryVariant = primary.kind === 'review' ? 'outline' : 'ghost'
  const secondary =
    menu.length === 1 ? (
      <Button variant={secondaryVariant} onClick={() => onMenuAction?.(tx, menu[0])}>
        {menuLabel(menu[0])}
      </Button>
    ) : menu.length > 1 ? (
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant={secondaryVariant} />}>
          More actions
          <ChevronDown />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-auto min-w-56 whitespace-nowrap">
          {menu.map((action) => (
            <DropdownMenuItem key={action} onClick={() => onMenuAction?.(tx, action)}>
              {menuLabel(action)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    ) : undefined
  const primaryButton = primary.kind !== 'review' && <Button onClick={run}>{primary.label}</Button>
  const notify = signed < account.threshold && onRemind && (
    <Button variant="outline" size="xs" onClick={() => onRemind(tx)}>
      {remindedIds.includes(tx.id) ? 'Notify again' : 'Notify'}
    </Button>
  )
  const rows = toSignatureRows(tx, persona).map((row, index): DrawerSignatureRow =>
    row.kind === 'created'
      ? { id: `created-${index}`, status: 'created', signer: row.name, time: row.time }
      : {
          id: row.address,
          status: row.kind,
          signer: <IdentityRow name={row.name} address={row.address} chainId={account.chainId} />,
          time: row.kind === 'signed' ? row.time : undefined,
          you: row.you,
          action: row.kind === 'needed' ? notify : undefined,
        },
  )
  return (
    <DrawerFooter
      summary={
        <DrawerSignatures
          // Remounts on "Expand all" or "Collapse all"; stepping keeps the list as you left it
          key={layout.sectionsVersion ?? 0}
          defaultOpen={layout.signersOpen}
          signed={signed}
          required={account.threshold}
          rows={rows}
          meta={signed < account.threshold ? getSignatureSummary(tx).split(' · ')[1] : undefined}
          actions={<CopyTransactionLink proposal={tx} />}
        />
      }
      hint={children ? undefined : ('hint' in primary && primary.hint) || getNotSignerNote(tx, persona)}
    >
      {feedback && (
        <p role="status" className="text-center text-xs text-muted-foreground">
          {feedback}
        </p>
      )}
      {children ??
        ((primaryButton || secondary) && (
          <DrawerActions primary={primaryButton || secondary} secondary={primaryButton ? secondary : undefined} />
        ))}
    </DrawerFooter>
  )
}
