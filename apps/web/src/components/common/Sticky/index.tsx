import type { ReactElement } from 'react'

export const Sticky = ({ children }: { children: ReactElement }): ReactElement => (
  <div className="sticky top-[103px] z-[2] -mt-2 mb-2 bg-[var(--color-background-main)] py-2 sm:top-[111px]">
    {children}
  </div>
)
