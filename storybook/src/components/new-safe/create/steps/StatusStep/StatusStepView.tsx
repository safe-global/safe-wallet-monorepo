import type { ReactElement, ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Circle } from 'lucide-react'
import css from './styles.module.css'

export type StatusStepViewProps = {
  isLoading: boolean
  safeAddress?: string
  identicon: ReactNode
  children: ReactNode
  isFirst?: boolean
}

export function StatusStepView({
  isLoading,
  safeAddress,
  identicon,
  children,
  isFirst,
}: StatusStepViewProps): ReactElement {
  const colorClass = isLoading ? 'text-[var(--color-border-main)]' : 'text-[var(--color-primary-main)]'

  return (
    <div className={`${css.label} relative flex items-center gap-2 text-left [&:not(:first-child)]:mt-9`}>
      {/* Like the old StepConnector, the segment spans only the 36px gap, stopping short of the dots */}
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
          {safeAddress && !isLoading ? identicon : <Skeleton className="h-[2.3em] w-[2.3em] rounded-full" />}
        </div>
        {children}
      </div>
    </div>
  )
}
