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
        className={cn(
          'grid grid-cols-1 justify-between gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]',
          contentClassName,
        )}
      >
        <div>
          <Typography variant="h4" className={cn('font-bold', titleClassName)}>
            {title}
          </Typography>
        </div>

        <div>{children}</div>
      </div>
    </Card>
  )
}

export default SettingsCard
