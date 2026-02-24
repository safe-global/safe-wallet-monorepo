import type { ReactElement, ReactNode } from 'react'
import { useRouter } from 'next/router'
import { cn } from '@/utils/cn'

interface WidgetItemProps {
  label: string
  info: string
  href?: string
  startNode?: ReactNode
  featuredNode?: ReactNode
  actionNode?: ReactNode
  highlighted?: boolean
  className?: string
}

const WidgetItem = ({
  label,
  info,
  href,
  startNode,
  featuredNode,
  actionNode,
  highlighted = false,
  className,
}: WidgetItemProps): ReactElement => {
  const router = useRouter()

  const handleClick = href ? () => router.push(href) : undefined

  return (
    <div
      data-slot="widget-item"
      role={href ? 'button' : undefined}
      tabIndex={href ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={href ? (e) => e.key === 'Enter' && handleClick?.() : undefined}
      className={cn(
        'flex items-center justify-between rounded-sm py-4 pl-4 pr-6',
        href && 'cursor-pointer transition-colors hover:bg-muted/50',
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

      {actionNode && <div className="flex flex-col items-center gap-2 min-w-16">{actionNode}</div>}
    </div>
  )
}

export { WidgetItem }
export type { WidgetItemProps }
