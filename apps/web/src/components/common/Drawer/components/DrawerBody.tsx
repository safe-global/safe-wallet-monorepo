import type { ReactElement, ReactNode } from 'react'

/** Scroll owner is the child, not this element — `last:pb-6` drops when a DrawerFooter follows. */
export const DrawerBody = ({ children }: { children?: ReactNode }): ReactElement => (
  <div className="flex min-h-0 flex-1 flex-col px-6 last:pb-6">{children}</div>
)
