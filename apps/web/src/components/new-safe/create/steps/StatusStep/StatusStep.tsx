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
          touches the next one and the line reads as one continuous rule behind every bullet. */}
      <div className="flex flex-col items-center self-stretch">
        <Circle
          data-testid="status-step-icon"
          className={`${css.icon} size-4 shrink-0 rounded-full bg-[var(--color-background-paper)] ${colorClass} ${isLoading ? '' : 'fill-current'}`}
        />
        {!isLast && (
          <div data-testid="status-step-connector" className="min-h-6 w-px flex-1 bg-[var(--color-border-light)]" />
        )}
      </div>
      <div className={`flex items-center gap-4 ${colorClass}`}>
        <div className="shrink-0">
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
