import { Fragment, type ReactElement, type ReactNode } from 'react'
import { cn } from '@safe-global/views/utils/cn'
import { Separator } from '@safe-global/views/components/ui/separator'
import { Typography } from '@safe-global/views/components/ui/typography'

export type DrawerListItem = {
  label: string
  content: ReactNode
}

export const DrawerList = ({
  items,
  mobileStack = false,
}: {
  items: DrawerListItem[]
  /** Puts the label above the value on phones, for values too long to share a row. */
  mobileStack?: boolean
}): ReactElement => (
  <dl className="flex w-full flex-col gap-3 rounded-lg bg-muted p-3">
    {items.map((item, index) => (
      <Fragment key={item.label}>
        {index > 0 && <Separator />}

        <div
          className={cn(
            'flex min-h-8 items-center justify-between gap-2',
            mobileStack && 'max-md:flex-col max-md:items-start max-md:gap-1',
          )}
        >
          <dt className="shrink-0">
            <Typography variant="paragraph-small-medium">{item.label}</Typography>
          </dt>
          <dd className={cn('min-w-0', mobileStack && 'max-md:w-full max-md:break-words')}>
            <Typography
              as="div"
              variant="paragraph-small"
              className={cn('text-right', mobileStack && 'max-md:text-left')}
            >
              {item.content}
            </Typography>
          </dd>
        </div>
      </Fragment>
    ))}
  </dl>
)
