import { Fragment, type ReactElement, type ReactNode } from 'react'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'

export type DrawerListItem = {
  label: string
  content: ReactNode
}

export const DrawerList = ({ items }: { items: DrawerListItem[] }): ReactElement => (
  <dl className="flex w-full flex-col gap-3 rounded-lg bg-muted p-3">
    {items.map((item, index) => (
      <Fragment key={item.label}>
        {index > 0 && <Separator />}

        <div className="flex min-h-8 items-center justify-between gap-2">
          <dt className="shrink-0">
            <Typography variant="paragraph-small-medium">{item.label}</Typography>
          </dt>
          <dd className="min-w-0">
            <Typography as="div" variant="paragraph-small" className="text-right">
              {item.content}
            </Typography>
          </dd>
        </div>
      </Fragment>
    ))}
  </dl>
)
