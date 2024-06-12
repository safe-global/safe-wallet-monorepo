import { type ReactElement, type ReactNode, useState, Suspense } from 'react'
import dynamic from 'next/dynamic'

const TopUpModal = dynamic(() => import('@/components/superChain/TopUpModal'))

const QrCodeButton = ({ children }: { children: ReactNode }): ReactElement => {
  const [modalOpen, setModalOpen] = useState<boolean>(false)

  return (
    <>
      <div data-testid="qr-modal-btn" onClick={() => setModalOpen(true)}>
        {children}
      </div>

      <TopUpModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}

export default QrCodeButton
