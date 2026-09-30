import { type MouseEvent, useState } from 'react'
import { Download, EllipsisVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import DeleteIcon from '@/public/images/common/delete.svg'
import EditIcon from '@/public/images/common/edit.svg'
import {
  type GetSpaceResponse,
  useLazyAddressBooksGetAddressBookItemsV1Query,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { downloadCsv, spaceAddressBookToCsv } from '../../utils/addressBookCsv'
import DeleteSpaceDialog from '../SpaceSettings/DeleteSpaceDialog'
import UpdateSpaceDialog from '../SpaceSettings/UpdateSpaceDialog'
import Track from '@/components/common/Track'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'

enum ModalType {
  RENAME = 'rename',
  REMOVE = 'remove',
}

const defaultOpen = { [ModalType.RENAME]: false, [ModalType.REMOVE]: false }

const SpaceContextMenu = ({ space }: { space: GetSpaceResponse }) => {
  const [open, setOpen] = useState<typeof defaultOpen>(defaultOpen)
  const dispatch = useAppDispatch()
  const [fetchAddressBook, { isFetching: isDownloading }] = useLazyAddressBooksGetAddressBookItemsV1Query()

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
    setOpen((prev) => ({ ...prev, [type]: true }))
  }

  const handleCloseModal = () => {
    setOpen(defaultOpen)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground"
              onClick={(e) => e.stopPropagation()}
              aria-label="Open space actions"
              data-testid="space-card-context-menu-button"
            />
          }
        >
          <EllipsisVertical />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={(e) => handleOpenModal(e, ModalType.RENAME)}>
            <EditIcon className="text-[var(--color-success-main)]" />
            <span>Rename</span>
          </DropdownMenuItem>

          <Track {...SPACE_EVENTS.DELETE_SPACE_MODAL} label={SPACE_LABELS.space_context_menu}>
            <DropdownMenuItem data-testid="remove-button" onClick={(e) => handleOpenModal(e, ModalType.REMOVE)}>
              <DeleteIcon className="text-[var(--color-error-main)]" />
              <span>Remove</span>
            </DropdownMenuItem>
          </Track>

          <Track {...SPACE_EVENTS.EXPORT_ADDRESS_BOOK} label={SPACE_LABELS.space_context_menu}>
            <DropdownMenuItem
              data-testid="download-address-book-button"
              disabled={isDownloading}
              onClick={handleDownload}
            >
              <Download className="text-muted-foreground" />
              <span>Download shared address book</span>
            </DropdownMenuItem>
          </Track>
        </DropdownMenuContent>
      </DropdownMenu>

      {open[ModalType.RENAME] && <UpdateSpaceDialog space={space} onClose={handleCloseModal} />}

      {open[ModalType.REMOVE] && <DeleteSpaceDialog space={space} onClose={handleCloseModal} />}
    </>
  )
}

export default SpaceContextMenu
