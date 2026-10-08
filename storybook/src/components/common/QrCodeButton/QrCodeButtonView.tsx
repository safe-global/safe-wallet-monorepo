import type { ReactElement, ReactNode } from 'react'

export type QrCodeButtonViewProps = {
  onClick: () => void
  children: ReactNode
}

export function QrCodeButtonView({ onClick, children }: QrCodeButtonViewProps): ReactElement {
  return (
    <div data-testid="qr-modal-btn" onClick={onClick}>
      {children}
    </div>
  )
}
