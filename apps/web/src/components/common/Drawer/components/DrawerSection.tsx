import type { ReactElement, ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'

export const DrawerSection = ({
  title,
  rightNode,
  children,
}: {
  title: ReactNode
  rightNode?: ReactNode
  children?: ReactNode
}): ReactElement => (
  <section className="flex w-full flex-col gap-2">
    <div className="flex items-baseline justify-between gap-2">
      <Typography variant="paragraph-mini-bold" color="muted" className="uppercase">
        {title}
      </Typography>
      {rightNode !== undefined && (
        <Typography variant="paragraph-small" color="muted" className="shrink-0">
          {rightNode}
        </Typography>
      )}
    </div>
    {children}
  </section>
)
