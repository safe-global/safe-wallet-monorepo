import ModalDialog from '@/components/common/ModalDialog'
import Perks from '@/components/superChain/Perks'
import useCurrentPerks from '@/hooks/super-chain/useCurrentPerks'
import { DialogContent, Typography } from '@mui/material'
import React from 'react'

function PerksModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, isLoading } = useCurrentPerks()
  return (
    <ModalDialog
      maxWidth="xs"
      open={open}
      hideChainIndicator
      dialogTitle={
        <Typography fontSize={24} fontWeight={600}>
          Current Perks
        </Typography>
      }
      onClose={onClose}
    >
      <DialogContent>
        <Perks data={data} isLoading={isLoading} />
      </DialogContent>
    </ModalDialog>
  )
}

export default PerksModal
