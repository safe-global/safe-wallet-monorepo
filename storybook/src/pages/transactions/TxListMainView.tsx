import type { ReactNode } from 'react'

export type TxListMainViewProps = {
  children: ReactNode
}

export const TxListMainView = ({ children }: TxListMainViewProps) => {
  return (
    <main>
      <div className="mb-8">{children}</div>
    </main>
  )
}
