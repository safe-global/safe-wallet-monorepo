import type { ReactNode } from 'react'

export type PageMainViewProps = {
  children: ReactNode
}

export const PageMainView = ({ children }: PageMainViewProps) => {
  return <main>{children}</main>
}
