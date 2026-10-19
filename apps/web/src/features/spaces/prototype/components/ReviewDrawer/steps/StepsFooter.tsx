import { ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { Avatar, AvatarFallback } from '@safe-global/views/components/ui/avatar'
import { Button } from '@safe-global/views/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@safe-global/views/components/ui/dropdown-menu'
import { Separator } from '@safe-global/views/components/ui/separator'
import { formatAuditDateTime } from '@/components/common/AuditLog'
import Identicon from '@/components/common/Identicon'
import { getMenuActions, getPrimaryAction, MENU_LABELS, type MenuAction } from '../../../services/actions'
import { getCreatedAt, getCreator } from '../../../services/model'
import { getSignatureSummary, getSignerRows } from '../../../services/signers'
import type { PreviewAction } from '../../../services/queue'
import type { Persona, Proposal } from '../../../types'
import { CopyTransactionLink } from '../../ProposalDetails'
import { SignedMark } from '../../QueueTable/SignerList'
import type { ReviewLayout } from '../ReviewDrawer'

// Same list as the signature tooltip: creator, signed, then not signed.
export function SignersPanel({ tx, persona, layout }: { tx: Proposal; persona: Persona; layout: ReviewLayout }) {
  const rows = getSignerRows(tx, persona)
  const creator = getCreator(tx)
  const toggle = () => layout.setSignersOpen(!layout.signersOpen)
  return (
    <section aria-label="Signatures">
      <div className="flex items-center gap-2">
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          className="flex cursor-pointer items-baseline gap-2 py-4"
          onClick={toggle}
        >
          <span className="text-sm font-medium">Signatures</span>
          <span className="text-xs text-muted-foreground">{getSignatureSummary(tx)}</span>
        </button>
        <CopyTransactionLink proposal={tx} />
        <button
          type="button"
          aria-label="Signatures"
          aria-expanded={layout.signersOpen}
          aria-controls="steps-signers"
          className="flex flex-1 cursor-pointer items-center justify-end self-stretch rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          onClick={toggle}
        >
          {layout.signersOpen ? (
            <ChevronUp className="size-4 text-muted-foreground" aria-hidden="true" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
          )}
        </button>
      </div>
      <ul
        id="steps-signers"
        hidden={!layout.signersOpen}
        className="max-h-[24vh] space-y-2 overflow-y-auto overscroll-contain pb-3"
      >
        <li className="flex min-h-8 items-center gap-2 text-sm">
          <Avatar size="xs" aria-hidden="true">
            <AvatarFallback>
              <Plus className="size-3.5" />
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1 truncate">{creator ? `Created by ${creator}` : 'Created'}</span>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {formatAuditDateTime(getCreatedAt(tx))}
          </span>
        </li>
        {rows.map((row) => (
          <li key={row.id} className="flex min-h-8 items-center gap-2 text-sm">
            <span className={`flex shrink-0 ${row.signed ? '' : 'opacity-50'}`}>
              <Identicon address={row.address} size={24} />
            </span>
            <span
              className={`min-w-0 flex-1 truncate ${row.signed ? '' : 'text-muted-foreground'} ${row.name || row.label === 'You' ? '' : 'font-mono text-xs'}`}
            >
              {row.label}
            </span>
            <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
              {row.signed && row.signedAt !== undefined ? formatAuditDateTime(row.signedAt) : 'Not signed yet'}
              <SignedMark signed={row.signed} />
            </span>
          </li>
        ))}
      </ul>
      <Separator className="mb-4" />
    </section>
  )
}

export function ConfirmStep({
  pendingAction,
  onBack,
  onAction,
}: {
  pendingAction: PreviewAction
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
            : 'Executing advances the nonce and replaces any conflicting transactions at the same nonce.'}
      </p>
      <p className="text-xs text-muted-foreground">Simulated action · no wallet request</p>
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

// Full-width actions in a stack, with a centred hint, as in the Policies drawers.
export function StepsActions({
  tx,
  items,
  persona,
  layout,
  remindedIds,
  onReview,
  onRemind,
  onMenuAction,
}: {
  tx: Proposal
  items: Proposal[]
  persona: Persona
  layout: ReviewLayout
  remindedIds: string[]
  onReview: (tx: Proposal) => void
  onRemind?: (tx: Proposal) => void
  onMenuAction?: (tx: Proposal, action: MenuAction) => void
}) {
  const primary = getPrimaryAction(tx, items, persona, remindedIds)
  const menu = getMenuActions(tx, items, persona, primary)
  const run = () => {
    if (primary.kind === 'flow') layout.setPendingAction(primary.flow)
    else if (primary.kind === 'goTo') onReview(primary.target)
    else if (primary.kind === 'remind') onRemind?.(primary.target)
  }
  const hint = 'hint' in primary ? primary.hint : undefined
  return (
    <div className="flex flex-col gap-2">
      {hint && <p className="text-center text-xs text-muted-foreground">{hint}</p>}
      {primary.kind !== 'review' && (
        <Button className="w-full" onClick={run}>
          {primary.label}
        </Button>
      )}
      {menu.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant={primary.kind === 'review' ? 'outline' : 'ghost'} className="w-full" />}
          >
            More actions
            <ChevronDown />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-auto min-w-56 whitespace-nowrap">
            {menu.map((action) => (
              <DropdownMenuItem key={action} onClick={() => onMenuAction?.(tx, action)}>
                {action === 'remind' && remindedIds.includes(tx.id) ? 'Remind signers again' : MENU_LABELS[action]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
