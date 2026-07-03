import type { ComponentProps } from 'react'
import { Card } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'

const SpaceSettingsSection = ({ className, ...props }: ComponentProps<'section'>) => {
  return <Card as="section" className={cn('mb-3 gap-0 rounded-2xl p-6', className)} {...props} />
}

type SpaceSettingsSectionTitleProps = Omit<ComponentProps<typeof Typography>, 'variant'>

export const SpaceSettingsSectionTitle = ({ className, ...props }: SpaceSettingsSectionTitleProps) => {
  return <Typography variant="paragraph-bold" className={cn('mb-5 block', className)} {...props} />
}

export default SpaceSettingsSection
