import ManageTrustedSafesContent from './ManageTrustedSafesContent'
import type { UseTrustedSafesModalReturn } from './useTrustedSafesModal'
import { TrustedSafesModalView } from '@views/components/common/TrustedSafesModal/TrustedSafesModalView'

interface TrustedSafesModalProps {
  modal: UseTrustedSafesModalReturn
}

const TrustedSafesModal = ({ modal }: TrustedSafesModalProps) => {
  return (
    <TrustedSafesModalView
      open={modal.isOpen}
      onClose={modal.close}
      renderContent={(props) => <ManageTrustedSafesContent modal={modal} onSecondary={modal.close} {...props} />}
    />
  )
}

export default TrustedSafesModal
