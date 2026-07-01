import type { ReactElement, ReactNode } from 'react'
import { cn } from '@/utils/cn'
import type { Tone } from './tokens'

/**
 * Highlight the MATCHING end characters (the 4 hex after `0x` when the fronts match,
 * and/or the last 4 when the backs match). Those identical ends are exactly what lets a
 * look-alike pass a quick glance. Everything else — including `0x` and the middle — is muted.
 */
const renderMatch = (addr: string, other: string, highlight: string): ReactNode => {
  const a = addr.toLowerCase()
  const b = other.toLowerCase()
  const frontMatch = a.slice(0, 6) === b.slice(0, 6)
  const backMatch = a.slice(-4) === b.slice(-4)
  const n = addr.length
  return [...addr].map((char, i) => {
    const same = (frontMatch && i >= 2 && i < 6) || (backMatch && i >= n - 4)
    return (
      <span key={i} className={same ? cn('rounded-[2px] font-bold', highlight) : 'text-[var(--color-text-secondary)]'}>
        {char}
      </span>
    )
  })
}

const Label = ({ children }: { children: ReactNode }): ReactElement => (
  <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">{children}</div>
)

/** The two-address comparison box, always visible while the guard is active. */
const CompareAddresses = ({
  entered,
  trusted,
  trustedName,
  tone,
}: {
  entered: string
  trusted: string
  trustedName: string
  tone: Tone
}): ReactElement => {
  const highlight = cn(tone.fg, tone.wash)
  return (
    <div className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-background-paper)] p-3.5">
      <Label>Address you entered</Label>
      <div className="mt-1 break-all font-mono text-[13px] leading-5">{renderMatch(entered, trusted, highlight)}</div>
      <div className="my-3 h-px bg-[var(--color-border-light)]" />
      <Label>Trusted contact it resembles · {trustedName}</Label>
      <div className="mt-1 break-all font-mono text-[13px] leading-5">{renderMatch(trusted, entered, highlight)}</div>
      <div className="mt-3 flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
        <span className={cn('inline-block size-2.5 rounded-[2px]', tone.wash)} />
        Highlighted characters are identical — that’s what makes look-alike addresses deceptive.
      </div>
    </div>
  )
}

export default CompareAddresses
