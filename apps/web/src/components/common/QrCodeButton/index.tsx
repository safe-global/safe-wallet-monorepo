import { type ReactElement, type ReactNode, useState, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { QrCodeButtonView } from '@views/components/common/QrCodeButton/QrCodeButtonView'

const QrModal = dynamic(() => import('./QrModal'))

const QrCodeButton = ({ children }: { children: ReactNode }): ReactElement => {
  const [modalOpen, setModalOpen] = useState<boolean>(false)

  return (
    <>
      <QrCodeButtonView onClick={() => setModalOpen(true)}>{children}</QrCodeButtonView>

      {modalOpen && (
        <Suspense>
          <QrModal onClose={() => setModalOpen(false)} />
        </Suspense>
      )}
    </>
  )
}

export default QrCodeButton
