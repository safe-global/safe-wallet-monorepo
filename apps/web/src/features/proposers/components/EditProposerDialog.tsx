import CheckWallet from '@/components/common/CheckWallet'
import Track from '@/components/common/Track'
import UpsertProposer from '@/features/proposers/components/UpsertProposer'
import useWallet from '@/hooks/wallets/useWallet'
import { useNestedSafeOwners } from '@/hooks/useNestedSafeOwners'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import EditIcon from '@/public/images/common/edit.svg'
import { SETTINGS_EVENTS } from '@/services/analytics'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { Delegate } from '@safe-global/store/gateway/AUTO_GENERATED/delegates'
import React, { useState } from 'react'

const EditProposerDialog = ({ proposer }: { proposer: Delegate }) => {
  const [open, setOpen] = useState<boolean>(false)
  const wallet = useWallet()
  const nestedSafeOwners = useNestedSafeOwners()

  const canEdit =
    sameAddress(wallet?.address, proposer.delegator) ||
    (nestedSafeOwners?.some((addr) => sameAddress(addr, proposer.delegator)) ?? false)

  return (
    <>
      <CheckWallet allowProposer={false}>
        {(isOk) => {
          const tooltipTitle =
            isOk && canEdit ? 'Edit proposer' : isOk && !canEdit ? 'Only the owner of this proposer can edit them' : ''

          const button = (
            <span tabIndex={0}>
              <Button
                variant="ghost"
                size="icon-sm"
                data-testid="edit-proposer-btn"
                onClick={() => setOpen(true)}
                disabled={!isOk || !canEdit}
              >
                <EditIcon className="size-4 text-border" />
              </Button>
            </span>
          )

          return (
            <Track {...SETTINGS_EVENTS.PROPOSERS.EDIT_PROPOSER}>
              {tooltipTitle ? (
                <Tooltip>
                  <TooltipTrigger render={button} />
                  <TooltipContent>{tooltipTitle}</TooltipContent>
                </Tooltip>
              ) : (
                button
              )}
            </Track>
          )
        }}
      </CheckWallet>

      {open && <UpsertProposer onClose={() => setOpen(false)} onSuccess={() => setOpen(false)} proposer={proposer} />}
    </>
  )
}

export default EditProposerDialog
