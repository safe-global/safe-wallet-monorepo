import type { ReactElement } from 'react'
import { useDarkMode } from '@/hooks/useDarkMode'
import { RemoveProposerModalView } from '@views/features/spaces/components/Policies/RemoveProposerModal/RemoveProposerModalView'

export type RemoveProposerModalProps = {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  /** While the wallet signs and the proposer is deleted. */
  isRemoving?: boolean
  error?: string
}

const RemoveProposerModal = ({
  open,
  onClose,
  onConfirm,
  isRemoving = false,
  error,
}: RemoveProposerModalProps): ReactElement => {
  const isDarkMode = useDarkMode()

  return (
    <RemoveProposerModalView
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      isRemoving={isRemoving}
      error={error}
      isDarkMode={isDarkMode}
    />
  )
}

export default RemoveProposerModal
