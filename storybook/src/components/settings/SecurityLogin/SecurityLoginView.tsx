import type { ReactNode } from 'react'

export type SecurityLoginViewProps = {
  children: ReactNode
}

export const SecurityLoginView = ({ children }: SecurityLoginViewProps) => {
  return <div className="flex flex-col gap-4">{children}</div>
}
