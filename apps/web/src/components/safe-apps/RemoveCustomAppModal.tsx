import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import ModalDialog from '@/components/common/ModalDialog'
import { RemoveCustomAppModalView } from '@views/components/safe-apps/RemoveCustomAppModalView'

type Props = {
  open: boolean
  app: SafeAppData
  onClose: () => void
  onConfirm: (appId: number) => void
}

const RemoveCustomAppModal = ({ open, onClose, onConfirm, app }: Props) => (
  <RemoveCustomAppModalView
    open={open}
    onClose={onClose}
    onConfirm={onConfirm}
    app={app}
    renderModalDialog={(props) => <ModalDialog {...props} />}
  />
)

export { RemoveCustomAppModal }
