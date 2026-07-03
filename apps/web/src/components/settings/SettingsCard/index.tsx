import type { ComponentProps, ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'

type SettingsCardProps = Omit<ComponentProps<'div'>, 'title'> & {
  title: ReactNode
  contentClassName?: string
  titleClassName?: string
}

const SettingsCard = ({
  title,
  titleClassName,
  contentClassName,
  className,
  children,
  ...props
}: SettingsCardProps) => {
  return (
    <Card className={cn('gap-0 rounded-lg p-8', className)} {...props}>
      <div
        data-slot="settings-card-content"
        className={cn('grid grid-cols-1 justify-between gap-6 lg:grid-cols-[1fr_2fr]', contentClassName)}
      >
        <div>
          <Typography variant="h4" className={titleClassName}>
            {title}
          </Typography>
        </div>

        <div>{children}</div>
      </div>
    </Card>
  )
}

export default SettingsCard
