import type { ReactElement } from 'react'
import { cn } from '@/utils/cn'

/** Middle-only re-entry: the front & back are locked, only the middle section is editable. */
const MiddleReentryField = ({
  front,
  back,
  mid,
  midMatch,
  onChange,
}: {
  front: string
  back: string
  mid: string
  midMatch: boolean
  onChange: (value: string) => void
}): ReactElement => {
  const hasInput = mid.trim().length > 0
  return (
    <div className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-background-paper)] p-3.5">
      <h4 className="m-0 text-[13px] font-semibold text-[var(--color-text-primary)]">Type the middle of the address</h4>
      <div className="mb-2.5 mt-0.5 text-xs text-[var(--color-text-secondary)]">
        The start and end match a trusted address — only the middle differs. Type that middle section from your own
        records to confirm.
      </div>
      <div
        className={cn(
          'flex items-center rounded-lg border bg-[var(--color-background-main)] px-3',
          !hasInput
            ? 'border-[var(--color-border-light)]'
            : midMatch
              ? 'border-[var(--color-success-main)]'
              : 'border-[var(--color-error-main)]',
        )}
      >
        <span className="shrink-0 py-2.5 font-mono text-[13px] text-[var(--color-text-secondary)]">{front}</span>
        <input
          aria-label="Middle of the address"
          value={mid}
          spellCheck={false}
          autoComplete="off"
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 border-0 bg-transparent px-1.5 py-2.5 text-center font-mono text-[13px] text-[var(--color-text-primary)] outline-none"
        />
        <span className="shrink-0 py-2.5 font-mono text-[13px] text-[var(--color-text-secondary)]">{back}</span>
      </div>
      {hasInput && (
        <div
          className={cn(
            'mt-2 text-xs font-semibold',
            midMatch ? 'text-[var(--color-success-dark)]' : 'text-[var(--color-error-dark)]',
          )}
        >
          {midMatch ? 'The middle section matches' : 'Keep typing the middle section'}
        </div>
      )}
    </div>
  )
}

export default MiddleReentryField
