import { AlertCircle } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface NotActivatedBadgeProps {
  isActivating?: boolean
  className?: string
}

function NotActivatedBadge({ isActivating = false, className }: NotActivatedBadgeProps) {
  return (
    <span
      data-testid="not-activated-badge"
      className={cn(
        'inline-flex w-fit items-center gap-1 rounded-full px-1.5 py-px text-[11px] leading-none',
        className,
      )}
      style={{
        backgroundColor: isActivating ? 'var(--color-info-light)' : 'var(--color-warning-background)',
        color: isActivating ? 'var(--color-info-dark)' : 'var(--color-warning-main)',
      }}
    >
      <AlertCircle className="size-3 shrink-0" />
      {isActivating ? 'Activating' : 'Not activated'}
    </span>
  )
}

export default NotActivatedBadge
