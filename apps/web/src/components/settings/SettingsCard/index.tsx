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
    // eslint-disable-next-line no-restricted-syntax -- SettingsCard preset owns its 32px padding; no p-8 Card size variant exists
    <Card size="none" radius="lg" className={cn('p-8', className)} {...props}>
      <div
        data-slot="settings-card-content"
        className={cn('flex flex-col justify-between gap-6 lg:flex-row', contentClassName)}
      >
        <div className="lg:w-1/5 lg:shrink-0">
          <Typography variant="h4" className={cn('font-bold', titleClassName)}>
            {title}
          </Typography>
        </div>

        <div className="lg:min-w-0 lg:flex-1">{children}</div>
      </div>
    </Card>
  )
}

export default SettingsCard
