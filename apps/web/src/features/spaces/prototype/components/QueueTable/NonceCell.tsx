import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { getAccount, getState } from '../../services/model'
import type { Filter, Persona, Proposal } from '../../types'
import { HINT_CLASS, HintContent } from '../shared'

export type NonceState = 'now' | 'sign' | 'waiting' | 'blocked'

export const getNonceState = (tx: Proposal, persona: Persona): NonceState => {
  const state = getState(tx, persona)
  if (state.ready) return 'now'
  if (state.canSign) return 'sign'
  return state.waiting ? 'blocked' : 'waiting'
}

// All next steps row icons are 24px, so they align.
const CIRCLE =
  'flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full px-[3px] font-mono text-[11px] tabular-nums'
// Green fill: ready to execute. Green ring: needs your signature. Dashed: waiting on others. Grey: blocked.
export const NONCE_STYLES: Record<NonceState, string> = {
  now: 'border-[1.5px] border-success-strong bg-success-muted/70 text-success-strong dark:bg-success-subtle',
  sign: 'border-[1.5px] border-success-strong bg-card font-medium text-success-strong',
  waiting: 'border-[1.5px] border-dashed border-muted-foreground/50 bg-card text-muted-foreground',
  blocked: 'border-[1.5px] border-border bg-muted text-muted-foreground',
}
// Status section headers use the same circle as their nonces.
export const STATUS_NONCE_STATE: Record<Filter, NonceState> = {
  ready: 'now',
  sign: 'sign',
  awaiting: 'waiting',
  waiting: 'blocked',
}
const STATE_LABELS: Record<NonceState, string> = {
  now: 'Ready to execute',
  sign: 'Ready to sign',
  waiting: 'Waiting on others',
  blocked: 'Blocked',
}
export const COMPETING = 'border-[1.5px] border-[var(--warning-accent)] bg-card text-warning-strong'

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

export function NonceCircle({ tx, persona, competing }: { tx: Proposal; persona: Persona; competing: number }) {
  const state = getNonceState(tx, persona)
  const text = hint(tx, state, competing)
  return (
    <Tooltip delay={150}>
      <TooltipTrigger
        aria-label={`Nonce ${tx.nonce}. ${text}`}
        onClick={(event) => event.stopPropagation()}
        className={`${CIRCLE} ${competing && state !== 'now' ? COMPETING : NONCE_STYLES[state]}`}
      >
        {tx.nonce}
      </TooltipTrigger>
      <TooltipContent className={HINT_CLASS}>
        <HintContent
          title={`Nonce ${tx.nonce} · ${competing && state !== 'now' ? 'Conflicting transaction' : STATE_LABELS[state]}`}
          body={`${text} Each Safe runs its nonces in order, one at a time.`}
        />
      </TooltipContent>
    </Tooltip>
  )
}

// NonceCircle without a tooltip, for use inside buttons and headers.
// `group`: a conflict group. It stays amber when one option is ready.
export function NonceMark({
  tx,
  persona,
  competing = 0,
  group = false,
}: {
  tx: Proposal
  persona: Persona
  competing?: number
  group?: boolean
}) {
  const state = getNonceState(tx, persona)
  return (
    <span
      className={`${CIRCLE} ${group || (competing && state !== 'now') ? COMPETING : NONCE_STYLES[state]}`}
      aria-label={`Nonce ${tx.nonce}`}
      role="img"
    >
      {tx.nonce}
    </span>
  )
}
