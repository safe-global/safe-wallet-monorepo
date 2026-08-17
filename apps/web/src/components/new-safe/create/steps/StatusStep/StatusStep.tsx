import type { ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import css from '@/components/new-safe/create/steps/StatusStep/styles.module.css'
import { Circle } from 'lucide-react'
import Identicon from '@/components/common/Identicon'

const StatusStep = ({
  isLoading,
  safeAddress,
  children,
  isLast,
}: {
  isLoading: boolean
  safeAddress?: string
  children: ReactNode
  /** Omits the connector line below the icon for the final step in the list */
  isLast?: boolean
}) => {
  const colorClass = isLoading ? 'text-[var(--color-border-main)]' : 'text-[var(--color-primary-main)]'

  return (
    <div className={`${css.label} flex items-start gap-2`}>
      {/* Icon rail: the bullet sits on top of the connector line in normal flow (no absolute
          positioning), so it never gets painted over. Rows stack with zero gap, so each segment
          touches the next one and the line reads as one continuous rule behind every bullet.
          pt-3 shifts the dot down so its center lines up with the avatar's center: the avatar is
          pinned to the top of its own column below (self-start, ~32-37px tall depending on
          Identicon vs. loading Skeleton) while the dot is ~12px (see .icon in styles.module.css),
          so half the height difference is ~10-12px. */}
      <div className="flex flex-col items-center self-stretch pt-3">
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
