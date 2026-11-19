import type { ReactElement, ReactNode } from 'react'
import { cn } from '@safe-global/views/utils/cn'

/** One button fills the row; with a secondary, they split 1:2 so the primary stays the obvious target. */
export const DrawerActions = ({ primary, secondary }: { primary: ReactNode; secondary?: ReactNode }): ReactElement => (
  <div className={cn('grid gap-2', secondary && 'grid-cols-[1fr_2fr]')}>
    {secondary}
    {primary}
  </div>
)
