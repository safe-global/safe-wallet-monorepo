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
      {/* The 12px top stub centers the dot against the avatar and, on all rows but the first,
          paints as line so the previous row's connector touches this dot. */}
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
        {/* self-start keeps the avatar's center fixed even when the text block wraps taller */}
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
