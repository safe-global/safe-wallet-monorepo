import type { ReactElement, ReactNode } from 'react'
import { useRouter } from 'next/router'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'

interface WidgetItemProps {
  label: string | ReactNode
  info: string | ReactNode
  /** Optional second line (e.g. amount + recipient); can wrap so full text is visible. */
  description?: string | ReactNode
  href?: string
  onClick?: () => void
  startNode?: ReactNode
  featuredNode?: ReactNode
  actionNode?: ReactNode
  highlighted?: boolean
  className?: string
}

const WidgetItem = ({
  label,
  info,
  description,
  href,
  onClick,
  startNode,
  featuredNode,
  actionNode,
  highlighted = false,
  className,
}: WidgetItemProps): ReactElement => {
  const router = useRouter()

  const handleClick =
    href || onClick
      ? () => {
          onClick?.()
          href && router.push(href)
        }
      : undefined

  return (
    <div
      data-slot="widget-item"
      role={handleClick ? 'button' : undefined}
      tabIndex={handleClick ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={handleClick ? (e) => e.key === 'Enter' && handleClick() : undefined}
      className={cn(
        'flex flex-wrap items-center gap-x-4 gap-y-2 rounded-sm py-4 pl-4 pr-6',
        handleClick && 'cursor-pointer transition-colors hover:bg-muted/50',
        highlighted && 'bg-background',
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-4">
        {startNode}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 overflow-hidden">
          {typeof label === 'string' ? (
            <Typography variant="paragraph-medium" className="overflow-hidden whitespace-nowrap">
              {label}
            </Typography>
          ) : (
            label
          )}
          {typeof description === 'string' ? (
            <Typography variant="paragraph-small" color="muted" className="break-words">
              {description}
            </Typography>
          ) : (
            description
          )}
          {typeof info === 'string' ? (
            <Typography variant="paragraph-mini" color="muted" className="overflow-hidden whitespace-nowrap">
              {info}
            </Typography>
          ) : (
            info
          )}
        </div>
      </div>

      {(featuredNode || actionNode) && (
        <div className="ml-auto flex shrink-0 items-center gap-4">
          {featuredNode && <div className="flex items-center justify-center">{featuredNode}</div>}
          {actionNode && <div className="flex flex-col items-center gap-2 min-w-16">{actionNode}</div>}
        </div>
      )}
    </div>
  )
}

export { WidgetItem }
export type { WidgetItemProps }
