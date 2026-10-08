import { type MouseEvent, useState } from 'react'
import {
  type GetSpaceResponse,
  useLazyAddressBooksGetAddressBookItemsV1Query,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { downloadCsv, spaceAddressBookToCsv } from '../../utils/addressBookCsv'
import DeleteSpaceDialog from '../SpaceSettings/DeleteSpaceDialog'
import UpdateSpaceDialog from '../SpaceSettings/UpdateSpaceDialog'
import { useSpaceDeletionGuard } from '@/features/spaces'
import { SpaceContextMenuView } from '@views/features/spaces/components/SpaceCard/SpaceContextMenuView'

enum ModalType {
  RENAME = 'rename',
  REMOVE = 'remove',
}

const defaultOpen = { [ModalType.RENAME]: false, [ModalType.REMOVE]: false }

const SpaceContextMenu = ({ space }: { space: GetSpaceResponse }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [open, setOpen] = useState<typeof defaultOpen>(defaultOpen)
  const dispatch = useAppDispatch()
  const [fetchAddressBook, { isFetching: isDownloading }] = useLazyAddressBooksGetAddressBookItemsV1Query()
  const { isDeletionBlocked, blockedReason } = useSpaceDeletionGuard(isMenuOpen ? space.uuid : null)

  const handleDownload = async (e: MouseEvent) => {
    e.stopPropagation()
    try {
      const { data } = await fetchAddressBook({ spaceId: space.uuid }).unwrap()
      downloadCsv(`workspace-${space.uuid}-address-book.csv`, spaceAddressBookToCsv(data))
    } catch {
      dispatch(
        showNotification({
          message: 'Failed to download the shared address book. Please try again.',
          variant: 'error',
          groupKey: 'download-address-book-error',
        }),
      )
    }
  }

  const handleOpenModal = (e: MouseEvent, type: keyof typeof open) => {
    e.stopPropagation()
    setIsMenuOpen(false)
    setOpen((prev) => ({ ...prev, [type]: true }))
  }

  const handleCloseModal = () => {
    setOpen(defaultOpen)
  }

  return (
    <SpaceContextMenuView
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
      isDeletionBlocked={isDeletionBlocked}
      blockedReason={blockedReason}
      isDownloading={isDownloading}
      onRename={(e) => handleOpenModal(e, ModalType.RENAME)}
      onRemove={(e) => handleOpenModal(e, ModalType.REMOVE)}
      onDownload={handleDownload}
      dialogs={
        <>
          {open[ModalType.RENAME] && <UpdateSpaceDialog space={space} onClose={handleCloseModal} />}

          {open[ModalType.REMOVE] && <DeleteSpaceDialog space={space} onClose={handleCloseModal} />}
        </>
      }
    />
  )
}

export default SpaceContextMenu
