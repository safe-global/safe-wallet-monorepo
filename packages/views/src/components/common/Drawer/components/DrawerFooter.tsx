import type { ReactElement, ReactNode } from 'react'

export const DrawerFooter = ({ children }: { children?: ReactNode }): ReactElement => (
  <div className="px-6 pb-6">{children}</div>
)
