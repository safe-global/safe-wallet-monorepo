import { type ReactElement, type ReactNode, useState, Suspense } from 'react'
import dynamic from 'next/dynamic'

const QrModal = dynamic(() => import('./QrModal'))

const QrCodeButton = ({ children }: { children: ReactNode }): ReactElement => {
  const [modalOpen, setModalOpen] = useState<boolean>(false)

  return (
    <>
      <div data-testid="qr-modal-btn" onClick={() => setModalOpen(true)}>
        {children}
      </div>

      {modalOpen && (
        <Suspense>
          <QrModal onClose={() => setModalOpen(false)} />
        </Suspense>
      )}
    </>
  )
}

export default QrCodeButton
