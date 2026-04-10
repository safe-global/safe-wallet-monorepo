import type { ReactElement, ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'

interface WidgetEmptyStateProps {
  icon: ReactNode
  text: string
  subtitle?: string
  action?: ReactNode
  iconContainerClassName?: string
  className?: string
}

const WidgetEmptyState = ({
  icon,
  text,
  subtitle,
  action,
  className,
  iconContainerClassName,
}: WidgetEmptyStateProps): ReactElement => {
  return (
    <div className={cn('flex flex-1 flex-col items-center gap-4 py-10 justify-center h-fit', className)}>
      <div className={cn('flex size-14 items-center justify-center rounded-full bg-green-100', iconContainerClassName)}>
        {icon}
      </div>
      <div className="flex flex-col items-center gap-2 text-center">
        <Typography variant="paragraph-bold">{text}</Typography>
        {subtitle && (
          <Typography variant="paragraph-small" color="muted">
            {subtitle}
          </Typography>
        )}
      </div>
      {action}
    </div>
  )
}

export { WidgetEmptyState }
export type { WidgetEmptyStateProps }
