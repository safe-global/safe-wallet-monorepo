import type { ReactNode } from 'react'

export type SpaceDashboardPageViewProps = {
  children: ReactNode
}

export const SpaceDashboardPageView = ({ children }: SpaceDashboardPageViewProps) => {
  return <main className="!pt-0">{children}</main>
}
