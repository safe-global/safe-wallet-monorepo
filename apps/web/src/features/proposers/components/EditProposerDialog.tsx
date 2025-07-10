import CheckWallet from '@/components/common/CheckWallet'
import Track from '@/components/common/Track'
import UpsertProposer from '@/features/proposers/components/UpsertProposer'
import useWallet from '@/hooks/wallets/useWallet'
import EditIcon from '@/public/images/common/edit.svg'
import { SETTINGS_EVENTS } from '@/services/analytics'
import { IconButton, SvgIcon, Tooltip } from '@mui/material'
import type { Delegate } from '@safe-global/safe-gateway-typescript-sdk/dist/types/delegates'
import React, { useState } from 'react'

const EditProposerDialog = ({ proposer }: { proposer: Delegate }) => {
  const [open, setOpen] = useState<boolean>(false)
  const wallet = useWallet()

  const canEdit = wallet?.address === proposer.delegator

  return (
    <>
      <CheckWallet allowProposer={false}>
        {(isOk) => (
          <Track {...SETTINGS_EVENTS.PROPOSERS.EDIT_PROPOSER}>
            <Tooltip
              title={
                isOk && canEdit
                  ? 'Edit proposer'
                  : isOk && !canEdit
                    ? 'Only the owner of this proposer can edit them'
                    : undefined
              }
            >
              <span>
                <IconButton
                  data-testid="edit-proposer-btn"
                  onClick={() => setOpen(true)}
                  size="small"
                  disabled={!isOk || !canEdit}
                >
                  <SvgIcon component={EditIcon} inheritViewBox color="border" fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Track>
        )}
      </CheckWallet>

      {open && <UpsertProposer onClose={() => setOpen(false)} onSuccess={() => setOpen(false)} proposer={proposer} />}
    </>
  )
}

export default EditProposerDialog
