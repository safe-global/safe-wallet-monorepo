import { cn } from '@/utils/cn'

export const StatusDot = ({ isWarning, className }: { isWarning?: boolean; className?: string }) => (
  <span
    aria-hidden
    data-testid="status-dot"
    data-warning={isWarning || undefined}
    className={cn(
      'inline-block size-1.5 shrink-0 rounded-full',
      isWarning ? 'bg-badge-dot-warning' : 'bg-badge-dot-success',
      className,
    )}
  />
)
