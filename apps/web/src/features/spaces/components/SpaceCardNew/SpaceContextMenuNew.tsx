import { type MouseEvent, useState } from 'react'
import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import DeleteSpaceDialog from '../SpaceSettings/DeleteSpaceDialog'
import UpdateSpaceDialog from '../SpaceSettings/UpdateSpaceDialog'
import { useSpaceDeletionGuard } from '@/features/spaces'
import { SpaceContextMenuNewView } from '@views/features/spaces/components/SpaceCardNew/SpaceContextMenuNewView'

enum ModalType {
  RENAME = 'rename',
  REMOVE = 'remove',
}

const defaultOpen = { [ModalType.RENAME]: false, [ModalType.REMOVE]: false }

const SpaceContextMenuNew = ({ space }: { space: GetSpaceResponse }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [open, setOpen] = useState<typeof defaultOpen>(defaultOpen)
  const { isDeletionBlocked, blockedReason } = useSpaceDeletionGuard(isMenuOpen ? space.uuid : null)

  const handleOpenModal = (e: MouseEvent, type: keyof typeof open) => {
    e.stopPropagation()
    setIsMenuOpen(false)
    setOpen((prev) => ({ ...prev, [type]: true }))
  }

  const handleCloseModal = () => {
    setOpen(defaultOpen)
  }

  return (
    <SpaceContextMenuNewView
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
      isDeletionBlocked={isDeletionBlocked}
      blockedReason={blockedReason}
      onRename={(e) => handleOpenModal(e, ModalType.RENAME)}
      onRemove={(e) => handleOpenModal(e, ModalType.REMOVE)}
      dialogs={
        <>
          {open[ModalType.RENAME] && <UpdateSpaceDialog space={space} onClose={handleCloseModal} />}

          {open[ModalType.REMOVE] && <DeleteSpaceDialog space={space} onClose={handleCloseModal} />}
        </>
      }
    />
  )
}

export default SpaceContextMenuNew
