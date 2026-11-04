import type { ReactElement, ReactNode } from 'react'
import { Typography } from '@safe-global/views/components/ui/typography'

export const DrawerTitle = ({ size = 'md', children }: { size?: 'md' | 'lg'; children?: ReactNode }): ReactElement => (
  <Typography variant={size === 'lg' ? 'paragraph-bold' : 'paragraph-small-bold'} className="truncate leading-tight">
    {children}
  </Typography>
)
