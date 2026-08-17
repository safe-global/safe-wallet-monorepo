import type { ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import css from '@/components/new-safe/create/steps/StatusStep/styles.module.css'
import { Circle } from 'lucide-react'
import Identicon from '@/components/common/Identicon'

const StatusStep = ({
  isLoading,
  safeAddress,
  children,
  isFirst,
  isLast,
}: {
  isLoading: boolean
  safeAddress?: string
  children: ReactNode
  /** Hides the connector stub above the icon for the first step in the list */
  isFirst?: boolean
  /** Omits the connector line below the icon for the final step in the list */
  isLast?: boolean
}) => {
  const colorClass = isLoading ? 'text-[var(--color-border-main)]' : 'text-[var(--color-primary-main)]'

  return (
    <div className={`${css.label} flex items-start gap-2`}>
      {/* Icon rail: the bullet sits between two connector segments in normal flow (no absolute
          positioning), so it never gets painted over. The 12px top stub shifts the dot down so its
          center lines up with the avatar's center (avatar ~32-37px pinned to its column top, dot
          ~12px, half the difference ≈ 12px) and, on every row but the first, is painted as line so
          the segment coming from the previous row visually touches this row's dot. */}
      <div className="flex flex-col items-center self-stretch">
        <div
          data-testid="status-step-connector-top"
          className={`h-3 w-px shrink-0 ${isFirst ? '' : 'bg-[var(--color-border-light)]'}`}
        />
        <Circle
          data-testid="status-step-icon"
          className={`${css.icon} size-4 shrink-0 rounded-full bg-[var(--color-background-paper)] ${colorClass} ${isLoading ? '' : 'fill-current'}`}
        />
        {!isLast && (
          <div data-testid="status-step-connector" className="min-h-6 w-px flex-1 bg-[var(--color-border-light)]" />
        )}
      </div>
      <div className={`flex items-center gap-4 ${colorClass}`}>
        {/* self-start: the avatar's own center must stay fixed (avatarHeight / 2) regardless of
            how tall the sibling text block gets (e.g. the first step's tx hash can wrap to
            multiple lines) — otherwise the dot above would need a different offset per row. */}
        <div data-testid="status-step-avatar" className="shrink-0 self-start">
          {safeAddress && !isLoading ? (
            <Identicon address={safeAddress} size={32} />
          ) : (
            <Skeleton className="h-[2.3em] w-[2.3em] rounded-full" />
          )}
        </div>
        {children}
      </div>
    </div>
  )
}

export default StatusStep
