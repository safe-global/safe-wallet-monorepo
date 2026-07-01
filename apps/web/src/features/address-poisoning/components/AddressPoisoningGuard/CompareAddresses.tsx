import type { ReactElement, ReactNode } from 'react'
import { cn } from '@/utils/cn'
import type { Tone } from './tokens'

/** Per-char diff: differing characters of `a` (vs `b`) are emphasised in the severity colour. */
const renderDiff = (a: string, b: string, highlight: string): ReactNode => {
  const la = a.toLowerCase()
  const lb = b.toLowerCase()
  return [...a].map((char, i) => (
    <span key={i} className={la[i] !== lb[i] ? cn('rounded-[2px] font-bold', highlight) : undefined}>
      {char}
    </span>
  ))
}

const Label = ({ children }: { children: ReactNode }): ReactElement => (
  <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">{children}</div>
)

/** The two-address, character-by-character comparison box with a legend. */
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
    <div className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-background-paper)] p-3.5 text-[var(--color-text-primary)]">
      <Label>Address you entered</Label>
      <div className="mt-1 break-all font-mono text-[13px] leading-5">{renderDiff(entered, trusted, highlight)}</div>
      <div className="my-3 h-px bg-[var(--color-border-light)]" />
      <Label>Trusted contact it resembles · {trustedName}</Label>
      <div className="mt-1 break-all font-mono text-[13px] leading-5">{renderDiff(trusted, entered, highlight)}</div>
      <div className="mt-3 flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
        <span className={cn('inline-block size-2.5 rounded-[2px]', tone.wash)} />
        Highlighted characters differ between the two addresses.
      </div>
    </div>
  )
}

export default CompareAddresses
