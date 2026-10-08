import EntryDialog from '@/components/address-book/EntryDialog'
import { useAddressBookItem } from '@/hooks/useAllAddressBooks'
import useChainId from '@/hooks/useChainId'
import type { Delegate } from '@safe-global/store/gateway/AUTO_GENERATED/delegates'
import { useState } from 'react'
import { EditProposerDialogView } from '@views/features/proposers/components/EditProposerDialogView'

const EditProposerDialog = ({ proposer }: { proposer: Delegate }) => {
  const [open, setOpen] = useState<boolean>(false)
  const chainId = useChainId()
  const contact = useAddressBookItem(proposer.delegate, chainId)

  return (
    <EditProposerDialogView
      onOpen={() => setOpen(true)}
      dialog={
        open && (
          <EntryDialog
            handleClose={() => setOpen(false)}
            defaultValues={{ address: proposer.delegate, name: contact?.name ?? '' }}
            disableAddressInput
          />
        )
      }
    />
  )
}

export default EditProposerDialog
