import type { ReactElement } from 'react'

// Pins at the page header's bottom edge, tracked live: a fixed offset leaves a band of scrolling
// content showing through whenever the header is shorter than it (see `--page-header-bottom`).
export const Sticky = ({ children }: { children: ReactElement }): ReactElement => (
  <div className="sticky top-[var(--page-header-bottom)] z-[2] -mt-2 mb-2 bg-[var(--color-background-main)] py-2 dark:bg-background">
    {children}
  </div>
)
