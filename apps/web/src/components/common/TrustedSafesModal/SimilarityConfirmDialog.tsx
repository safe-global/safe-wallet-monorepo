import DialogActions from '@/components/common/DialogActions'
import EthHashInfo from '@/components/common/EthHashInfo'
import { SimilarityConfirmDialogView } from '@views/components/common/TrustedSafesModal/SimilarityConfirmDialogView'

interface SimilarityConfirmDialogProps {
  open: boolean
  /** Only the address and name are rendered, so any flagged safe/line can be passed. */
  safe: { address: string; name?: string }
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Confirmation dialog for selecting an address flagged as similar to another address
 * Warns user about potential address poisoning attack
 */
const SimilarityConfirmDialog = ({ open, safe, onConfirm, onCancel }: SimilarityConfirmDialogProps) => {
  return (
    <SimilarityConfirmDialogView
      open={open}
      safe={safe}
      onCancel={onCancel}
      renderAddress={(props) => <EthHashInfo {...props} />}
      renderActions={(props) => <DialogActions onCancel={onCancel} onConfirm={onConfirm} {...props} />}
    />
  )
}

export default SimilarityConfirmDialog
