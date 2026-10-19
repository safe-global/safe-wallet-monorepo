import { Check, Circle } from 'lucide-react'
import { ICON_STROKE } from '@safe-global/views/components/common/iconStroke'
import Identicon from '@/components/common/Identicon'
import { getSignatureSummary, getSignerRows } from '../../services/signers'
import type { Persona, Proposal } from '../../types'

const MAX_SIGNERS = 6

export function SignedMark({ signed, onDark }: { signed: boolean; onDark?: boolean }) {
  return signed ? (
    <span
      className="flex size-3.5 shrink-0 items-center justify-center rounded-full bg-badge-dot-success text-black"
      role="img"
      aria-label="Signed"
    >
      <Check className="size-2.5" strokeWidth={3} aria-hidden="true" />
    </span>
  ) : (
    <Circle
      className={`size-3.5 shrink-0 ${onDark ? '' : 'text-muted-foreground'}`}
      strokeWidth={ICON_STROKE}
      aria-label="Not signed yet"
    />
  )
}

// Signature tooltip: who signed and who did not. Works for signers without names.
export function SignerList({ tx, persona }: { tx: Proposal; persona: Persona }) {
  const rows = getSignerRows(tx, persona)
  const shown = rows.slice(0, MAX_SIGNERS)
  return (
    <>
      <p className="font-medium">{getSignatureSummary(tx)}</p>
      <ul className="mt-1.5 space-y-1">
        {shown.map((row) => (
          <li key={row.id} className={`flex items-center gap-2 ${row.signed ? '' : 'text-background/60'}`}>
            <SignedMark signed={row.signed} onDark />
            <span className={`flex shrink-0 ${row.signed ? '' : 'opacity-60'}`}>
              <Identicon address={row.address} size={16} />
            </span>
            <span className={row.name || row.label === 'You' ? '' : 'font-mono'}>{row.label}</span>
          </li>
        ))}
      </ul>
      {rows.length > shown.length && <p className="mt-1 text-background/60">+{rows.length - shown.length} more</p>}
    </>
  )
}
