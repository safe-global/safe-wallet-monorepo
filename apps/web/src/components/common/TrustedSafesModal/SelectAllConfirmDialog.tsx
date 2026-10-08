import EthHashInfo from '@/components/common/EthHashInfo'
import { SelectAllConfirmDialogView } from '@views/components/common/TrustedSafesModal/SelectAllConfirmDialogView'
import type { SelectableItem } from './useTrustedSafesModal.types'

interface SelectAllConfirmDialogProps {
  open: boolean
  similarAddresses: SelectableItem[]
  onConfirm: () => void
  onSkip: () => void
  onCancel: () => void
}

const SelectAllConfirmDialog = ({
  open,
  similarAddresses,
  onConfirm,
  onSkip,
  onCancel,
}: SelectAllConfirmDialogProps) => {
  return (
    <SelectAllConfirmDialogView
      open={open}
      similarAddresses={similarAddresses}
      onConfirm={onConfirm}
      onSkip={onSkip}
      onCancel={onCancel}
      renderAddress={(props) => <EthHashInfo {...props} />}
    />
  )
}

export default SelectAllConfirmDialog
