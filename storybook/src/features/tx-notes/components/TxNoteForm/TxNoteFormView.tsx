import type { ReactNode } from 'react'

export type TxNoteFormViewProps = {
  children: ReactNode
}

export function TxNoteFormView({ children }: TxNoteFormViewProps) {
  return <div className="pt-6">{children}</div>
}
