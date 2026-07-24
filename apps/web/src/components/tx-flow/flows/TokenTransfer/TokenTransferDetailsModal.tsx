import { type ReactElement } from 'react'
import { DialogContent } from '@mui/material'
import type { SafeTransaction } from '@safe-global/types-kit'
import ModalDialog from '@/components/common/ModalDialog'
import { Receipt } from '@/components/tx/ConfirmTxDetails/Receipt'
import useTxPreview from '@/components/tx/confirmation-views/useTxPreview'

/**
 * Full transaction-verification details (Data / Hashes / JSON), shown in a modal so the one-screen
 * flow stays uncluttered while keeping every param the old multi-step "Review details" exposed.
 */
export const TokenTransferDetailsModal = ({
  safeTxData,
  onClose,
}: {
  safeTxData: SafeTransaction['data']
  onClose: () => void
}): ReactElement => {
  const [txPreview] = useTxPreview(safeTxData)

  return (
    <ModalDialog open dialogTitle="Transaction details" onClose={onClose}>
      <DialogContent sx={{ pt: 2 }}>
        <Receipt safeTxData={safeTxData} txData={txPreview?.txData} txInfo={txPreview?.txInfo} />
      </DialogContent>
    </ModalDialog>
  )
}

export default TokenTransferDetailsModal
