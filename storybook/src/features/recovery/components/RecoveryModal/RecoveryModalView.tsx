import type { ReactElement, ReactNode } from 'react'

export type RecoveryModalViewProps = {
  modal: ReactNode
}

export function RecoveryModalView({ modal }: RecoveryModalViewProps): ReactElement {
  return (
    <div
      className={`fixed inset-0 z-[3] flex items-center justify-center bg-[var(--color-background-main)] transition-opacity duration-300 ${
        modal ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      {modal}
    </div>
  )
}
