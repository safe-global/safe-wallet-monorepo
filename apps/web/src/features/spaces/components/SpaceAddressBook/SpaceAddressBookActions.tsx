import { type MouseEvent, useState } from 'react'
import EditContactDialog from './EditContactDialog'
import DeleteContactDialog from './DeleteContactDialog'
import { useIsAdmin } from '@/features/spaces'
import type { SpaceAddressBookItemDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { SpaceAddressBookActionsView } from '@views/features/spaces/components/SpaceAddressBook/SpaceAddressBookActionsView'

enum ModalType {
  EDIT = 'edit',
  REMOVE = 'remove',
}

const defaultOpen = { [ModalType.EDIT]: false, [ModalType.REMOVE]: false }

const SpaceAddressBookActions = ({
  entry,
  isCompact = false,
}: {
  entry: SpaceAddressBookItemDto
  isCompact?: boolean
}) => {
  const [open, setOpen] = useState<typeof defaultOpen>(defaultOpen)
  const isAdmin = useIsAdmin()

  const handleOpenModal = (e: MouseEvent, type: keyof typeof open) => {
    e.stopPropagation()
    setOpen((prev) => ({ ...prev, [type]: true }))
  }

  const handleCloseModal = () => {
    setOpen(defaultOpen)
  }

  const dialogs = (
    <>
      {open[ModalType.EDIT] && <EditContactDialog entry={entry} onClose={handleCloseModal} />}

      {open[ModalType.REMOVE] && (
        <DeleteContactDialog
          name={entry.name}
          address={entry.address}
          networks={entry.chainIds}
          onClose={handleCloseModal}
        />
      )}
    </>
  )

  return (
    <SpaceAddressBookActionsView
      isCompact={isCompact}
      isAdmin={isAdmin}
      dialogs={dialogs}
      onEdit={(e) => handleOpenModal(e, ModalType.EDIT)}
      onRemove={(e) => handleOpenModal(e, ModalType.REMOVE)}
    />
  )
}

export default SpaceAddressBookActions
