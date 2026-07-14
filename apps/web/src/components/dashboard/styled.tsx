/**
 * @usedBy features/positions/components/PositionsWidget/index.tsx (WidgetCard)
 * @usedBy features/recovery/components/RecoveryHeader/index.tsx (WidgetContainer, WidgetBody)
 */
import type { ComponentProps, ReactElement, ReactNode } from 'react'
import NextLink from 'next/link'
import type { LinkProps } from 'next/link'
import { Link } from '@/components/ui/link'
import { Typography } from '@/components/ui/typography'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'

export const WidgetContainer = ({ className, ...props }: ComponentProps<'section'>) => (
  <section className={cn('flex h-full flex-col', className)} {...props} />
)

export const WidgetBody = ({ className, ...props }: ComponentProps<'div'>) => (
  <div className={cn('flex h-full flex-col gap-3', className)} {...props} />
)

export const Card = ({ className, ...props }: ComponentProps<'div'>) => (
  <div
    className={cn(
      'relative box-border h-full grow overflow-hidden rounded-md bg-[var(--color-background-paper)] p-6 [&_h2]:mt-0',
      className,
    )}
    {...props}
  />
)

export const ViewAllLink = ({ url, text }: { url: LinkProps['href']; text?: string }): ReactElement => (
  <Link
    render={<NextLink href={url} />}
    data-testid="view-all-link"
    variant="inherit"
    className="-mr-1 flex items-center gap-1 text-sm font-bold text-[var(--color-primary-light)] no-underline hover:text-[var(--color-primary-main)] hover:no-underline"
  >
    {text || 'View all'} <ChevronRight className="size-5" />
  </Link>
)

export const WidgetCard = ({
  title,
  titleExtra,
  viewAllUrl,
  viewAllText,
  viewAllWrapper,
  children,
  testId,
}: {
  title: string
  titleExtra?: ReactNode
  viewAllUrl?: LinkProps['href']
  viewAllText?: string
  viewAllWrapper?: (children: ReactElement) => ReactElement
  children: ReactNode
  testId?: string
}): ReactElement => {
  const viewAllLink = viewAllUrl ? <ViewAllLink url={viewAllUrl} text={viewAllText} /> : null
  const wrappedViewAllLink = viewAllWrapper && viewAllLink ? viewAllWrapper(viewAllLink) : viewAllLink

  return (
    <div
      data-testid={testId}
      className="overflow-hidden rounded-xl bg-[var(--color-background-paper)] px-6 pb-3 pt-5 lg:px-3"
    >
      <div className="mb-2 flex flex-row justify-between px-3">
        <div className="flex flex-row items-center gap-2">
          <Typography variant="paragraph-bold">{title}</Typography>
          {titleExtra}
        </div>

        {wrappedViewAllLink}
      </div>

      {children}
    </div>
  )
}
