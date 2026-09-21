import type { ReactElement, ReactNode } from 'react'

export const DrawerSubtitle = ({ children }: { children?: ReactNode }): ReactElement => (
  <div className="flex items-center gap-1 text-xs leading-none text-muted-foreground">{children}</div>
)
