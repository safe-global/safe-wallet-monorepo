import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { getAccount, getState, getStatusTone } from '../../services/model'
import type { Filter, Persona, Proposal } from '../../types'
import { HINT_CLASS, HintContent, type StatusTone } from '../shared'

export type NonceState = 'now' | 'sign' | 'waiting' | 'blocked'

export const getNonceState = (tx: Proposal, persona: Persona): NonceState => {
  const state = getState(tx, persona)
  if (state.ready) return 'now'
  if (state.canSign) return 'sign'
  return state.waiting ? 'blocked' : 'waiting'
}

// Status dot colours match the status chips. Conflicts are amber.
const DOT: Record<StatusTone | 'conflict', string> = {
  success: 'bg-badge-dot-success',
  warning: 'bg-badge-dot-warning',
  destructive: 'bg-destructive',
  secondary: 'bg-muted-foreground',
  conflict: 'bg-badge-dot-warning',
}
// Grey by default. Dark when the row is hovered or selected.
const LABEL = 'flex h-6 shrink-0 items-center gap-1.5 text-sm tabular-nums transition-colors'
const ROW_COLOR =
  'text-muted-foreground group-hover/transaction:text-foreground group-data-[state=selected]/transaction:text-foreground'

// Section header icon: a 32px square, the size of the collapse button. Its left edge aligns with the nonce dots.
const SQUARE = 'ml-2 flex size-8 shrink-0 items-center justify-center rounded-md border'
// Three tones. Green: you can act. Amber: needs a decision. Grey: not your turn yet.
const SECTION_TONES = {
  green: `${SQUARE} border-success-strong/40 bg-success-muted/70 text-success-strong dark:bg-success-subtle`,
  amber: `${SQUARE} border-(--warning-accent)/40 bg-warning-subtle text-warning-strong`,
  grey: `${SQUARE} border-muted-foreground/40 bg-foreground/[0.05] text-muted-foreground`,
}
export const SECTION_STYLES: Record<Filter | 'conflicting', string> = {
  ready: SECTION_TONES.green,
  sign: SECTION_TONES.green,
  conflicting: SECTION_TONES.amber,
  awaiting: SECTION_TONES.grey,
  waiting: SECTION_TONES.grey,
}
const STATE_LABELS: Record<NonceState, string> = {
  now: 'Ready to execute',
  sign: 'Ready to sign',
  waiting: 'Waiting on others',
  blocked: 'Blocked',
}

const hint = (tx: Proposal, state: NonceState, competing: number) => {
  const { nextNonce } = getAccount(tx)
  const next = tx.nonce === nextNonce
  const base =
    state === 'now'
      ? 'Next in line. It can run now.'
      : state === 'sign'
        ? next
          ? 'Next in line. Needs your signature.'
          : `You can sign now. It runs after #${tx.nonce - 1}.`
        : state === 'waiting'
          ? 'Next in line. Waiting on other signers.'
          : `Blocked. It can't run until #${nextNonce} executes.`
  return competing ? `${base} ${competing + 1} conflicting transactions share this nonce; only one can execute.` : base
}

const Dot = ({ tone }: { tone: StatusTone | 'conflict' }) => (
  <span className={`size-1.5 shrink-0 rounded-full ${DOT[tone]}`} aria-hidden="true" />
)

export function NonceLabel({ tx, persona, competing }: { tx: Proposal; persona: Persona; competing: number }) {
  const state = getNonceState(tx, persona)
  const text = hint(tx, state, competing)
  return (
    <Tooltip delay={150}>
      <TooltipTrigger
        aria-label={`Nonce ${tx.nonce}. ${text}`}
        onClick={(event) => event.stopPropagation()}
        className={`${LABEL} ${ROW_COLOR}`}
      >
        <Dot tone={competing ? 'conflict' : getStatusTone(tx, persona)} />
        {tx.nonce}
      </TooltipTrigger>
      <TooltipContent className={HINT_CLASS}>
        <HintContent
          title={`Nonce ${tx.nonce} · ${competing ? 'Conflicting transaction' : STATE_LABELS[state]}`}
          body={`${text} Each Safe runs its nonces in order, one at a time.`}
        />
      </TooltipContent>
    </Tooltip>
  )
}

// NonceLabel without a tooltip, for use inside buttons and headers.
// `group`: a conflict group. Its dot is amber. `active`: one of its options is hovered.
export function NonceMark({
  tx,
  persona,
  competing = 0,
  group = false,
  active = false,
}: {
  tx: Proposal
  persona: Persona
  competing?: number
  group?: boolean
  active?: boolean
}) {
  return (
    <span className={`${LABEL} ${active ? 'text-foreground' : ROW_COLOR}`} aria-label={`Nonce ${tx.nonce}`} role="img">
      <Dot tone={group || competing ? 'conflict' : getStatusTone(tx, persona)} />
      {tx.nonce}
    </span>
  )
}
