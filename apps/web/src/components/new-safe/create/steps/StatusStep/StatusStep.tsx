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
  /** Hides the connector segment above the dot on the first step */
  isFirst?: boolean
  /** Hides the connector segment below the dot on the last step */
  isLast?: boolean
}) => {
  const colorClass = isLoading ? 'text-[var(--color-border-main)]' : 'text-[var(--color-primary-main)]'

  return (
    <div className={`${css.label} relative flex items-center gap-2 [&:not(:first-child)]:mt-9`}>
      {/* The segments run from the dot's edge (50% of the row ± the 7px dot radius) through the
          36px inter-row margin, so the line touches every dot and reads as continuous. */}
      {!isFirst && (
        <div
          data-testid="status-step-connector"
          className="absolute bottom-[calc(50%+7px)] left-[6.5px] top-[-36px] w-px bg-[var(--color-border-light)]"
        />
      )}
      {!isLast && (
        <div
          data-testid="status-step-connector"
          className="absolute bottom-0 left-[6.5px] top-[calc(50%+7px)] w-px bg-[var(--color-border-light)]"
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
