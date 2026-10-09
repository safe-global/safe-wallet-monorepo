import type { ReactElement, ComponentType, SyntheticEvent } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/design/components/ui/tooltip'
import { buttonVariants } from '@safe-global/design/components/ui/button'
import { Typography } from '@safe-global/design/components/ui/typography'
import { cn } from '@safe-global/design/utils/cn'
import LinkIcon from '@safe-global/design/assets/images/common/link.svg'
import Link from 'next/link'

export type ExplorerButtonProps = {
  title?: string
  href?: string
  className?: string
  icon?: ComponentType<{ className?: string }>
  onClick?: (e: SyntheticEvent) => void
  isCompact?: boolean
  fontSize?: string
}

const ExplorerButton = ({
  title = '',
  href = '',
  icon: Icon = LinkIcon,
  className,
  onClick,
  isCompact = true,
  fontSize = '0.875rem',
}: ExplorerButtonProps): ReactElement | null => {
  if (!href) return null

  return isCompact ? (
    <Tooltip>
      <TooltipTrigger
        render={
          <a
            data-testid="explorer-btn"
            aria-label={title}
            href={href}
            target="_blank"
            rel="noreferrer"
            onClick={onClick}
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'icon-xs' }),
              'text-inherit hover:text-inherit',
              className,
            )}
          />
        }
      >
        <Icon className="size-4" />
      </TooltipTrigger>
      <TooltipContent side="top">{title}</TooltipContent>
    </Tooltip>
  ) : (
    <Link
      data-testid="explorer-btn"
      className={className}
      target="_blank"
      rel="noreferrer"
      href={href}
      onClick={onClick}
    >
      <div className="flex items-center">
        <Typography
          variant="paragraph-small-bold"
          className="mr-[var(--space-1)] whitespace-nowrap"
          style={{ fontSize }}
        >
          View on explorer
        </Typography>

        <Icon className="size-5" />
      </div>
    </Link>
  )
}

export default ExplorerButton
