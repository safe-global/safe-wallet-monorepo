import type { ReactElement } from 'react'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'

interface WidgetFooterProps {
  count?: number
  text: string
  className?: string
  onClick?: () => void
  // Controls the leading count/spacer slot so text can align with widget row content.
  showLeadingSlot?: boolean
}

const WidgetFooter = ({ count, text, className, onClick, showLeadingSlot = true }: WidgetFooterProps): ReactElement => {
  return (
    <div
      data-slot="widget-footer"
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      className={cn(
        'mt-auto flex cursor-pointer items-center rounded-lg py-1 pl-4 pr-6 transition-colors hover:bg-muted/50',
        showLeadingSlot ? 'gap-4' : 'gap-0',
        !showLeadingSlot && 'min-h-10',
        className,
      )}
    >
      {showLeadingSlot && (
        <div className="p-1">
          {count !== undefined ? (
            <div className="flex size-8 items-center justify-center rounded-full bg-[#f0fdf4] text-xs font-semibold text-[#166534]">
              +{count}
            </div>
          ) : (
            <div className="size-8" />
          )}
        </div>
      )}
      <Typography variant="paragraph-small" color="muted">
        {text}
      </Typography>
    </div>
  )
}

export { WidgetFooter }
export type { WidgetFooterProps }
