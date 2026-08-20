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
}: {
  isLoading: boolean
  safeAddress?: string
  children: ReactNode
  /** Hides the connector segment above the dot on the first step */
  isFirst?: boolean
}) => {
  const colorClass = isLoading ? 'text-[var(--color-border-main)]' : 'text-[var(--color-primary-main)]'

  return (
    <div className={`${css.label} relative flex items-center gap-2 text-left [&:not(:first-child)]:mt-9`}>
      {/* Like the pre-migration StepConnector, the segment spans only the 36px margin between
          rows, so it stops short of the dots above and below it. */}
      {!isFirst && (
        <div
          data-testid="status-step-connector"
          className="absolute bottom-full left-[6.5px] top-[-36px] w-px bg-[var(--color-border-light)]"
        />
      )}
      <Circle
        data-testid="status-step-icon"
        className={`size-3.5 shrink-0 ${colorClass} ${isLoading ? '' : 'fill-current'}`}
      />
      <div className={`flex items-center gap-4 ${colorClass}`}>
        <div data-testid="status-step-avatar" className="shrink-0">
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
