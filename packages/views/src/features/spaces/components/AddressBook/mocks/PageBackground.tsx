import type { ReactNode } from 'react'

/** The app's page surface: grey main background, tables on white cards. Stories only. */
const PageBackground = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen bg-[var(--color-background-main)] p-6 dark:bg-[var(--background)]">{children}</div>
)

export default PageBackground
