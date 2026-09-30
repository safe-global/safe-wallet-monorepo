import Track from '@/components/common/Track'
import EntryDialog from '@/components/address-book/EntryDialog'
import { useAddressBookItem } from '@/hooks/useAllAddressBooks'
import useChainId from '@/hooks/useChainId'
import EditIcon from '@/public/images/common/edit.svg'
import { SETTINGS_EVENTS } from '@/services/analytics'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { Delegate } from '@safe-global/store/gateway/AUTO_GENERATED/delegates'
import { useState } from 'react'

const EditProposerDialog = ({ proposer }: { proposer: Delegate }) => {
  const [open, setOpen] = useState<boolean>(false)
  const chainId = useChainId()
  const contact = useAddressBookItem(proposer.delegate, chainId)

  return (
    <>
      <Track {...SETTINGS_EVENTS.PROPOSERS.EDIT_PROPOSER}>
        <Tooltip>
          <TooltipTrigger
            render={
              <span tabIndex={0}>
                <Button variant="ghost" size="icon-sm" data-testid="edit-proposer-btn" onClick={() => setOpen(true)}>
                  <EditIcon className="size-4 text-[var(--color-border-main)]" />
                </Button>
              </span>
            }
          />
          <TooltipContent>Rename proposer</TooltipContent>
        </Tooltip>
      </Track>

      {open && (
        <EntryDialog
          handleClose={() => setOpen(false)}
          defaultValues={{ address: proposer.delegate, name: contact?.name ?? '' }}
          disableAddressInput
        />
      )}
    </>
  )
}

export default EditProposerDialog
