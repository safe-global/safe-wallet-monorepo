import type { ReactElement, ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface WidgetItemProps {
  label: string
  info: string
  startNode?: ReactNode
  featuredNode?: ReactNode
  actionNode?: ReactNode
  highlighted?: boolean
  className?: string
}

const WidgetItem = ({
  label,
  info,
  startNode,
  featuredNode,
  actionNode,
  highlighted = false,
  className,
}: WidgetItemProps): ReactElement => {
  return (
    <div
      data-slot="widget-item"
      className={cn(
        'flex items-center justify-between rounded-xl py-4 pl-4 pr-6',
        highlighted && 'bg-background',
        className,
      )}
    >
      <div className="flex w-[220px] items-center gap-4">
        {startNode}
        <div className="flex flex-col gap-0.5">
          <span className="text-base leading-6 font-medium text-foreground">{label}</span>
          <span className="text-xs leading-4 text-muted-foreground">{info}</span>
        </div>
      </div>

      {featuredNode && <div className="flex items-center justify-center">{featuredNode}</div>}

      {actionNode && <div className="flex flex-col items-end gap-2">{actionNode}</div>}
    </div>
  )
}

export { WidgetItem }
export type { WidgetItemProps }
