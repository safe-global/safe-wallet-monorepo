import type { ReactElement } from 'react'
import { cn } from '@/utils/cn'

interface WidgetFooterProps {
  count?: number
  text: string
  className?: string
  onClick?: () => void
}

const WidgetFooter = ({ count, text, className, onClick }: WidgetFooterProps): ReactElement => {
  return (
    <div
      data-slot="widget-footer"
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      className={cn('flex cursor-pointer items-center gap-4 rounded-lg py-1 pl-4 pr-6', className)}
    >
      {count !== undefined && (
        <div className="p-1">
          <div className="flex size-8 items-center justify-center rounded-full bg-[#f0fdf4] text-xs font-semibold text-[#166534]">
            +{count}
          </div>
        </div>
      )}
      <span className={cn('text-sm text-muted-foreground', !count && 'ml-2')}>{text}</span>
    </div>
  )
}

export { WidgetFooter }
export type { WidgetFooterProps }
