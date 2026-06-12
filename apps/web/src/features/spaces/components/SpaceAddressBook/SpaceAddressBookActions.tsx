import { type MouseEvent, useState } from 'react'
import Track from '@/components/common/Track'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import EditIcon from '@/public/images/common/edit.svg'
import DeleteIcon from '@/public/images/common/delete.svg'
import EditContactDialog from './EditContactDialog'
import DeleteContactDialog from './DeleteContactDialog'
import { useIsAdmin } from '@/features/spaces'
import type { SpaceAddressBookItemDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

enum ModalType {
  EDIT = 'edit',
  REMOVE = 'remove',
}

const defaultOpen = { [ModalType.EDIT]: false, [ModalType.REMOVE]: false }

const SpaceAddressBookActions = ({ entry }: { entry: SpaceAddressBookItemDto }) => {
  const [open, setOpen] = useState<typeof defaultOpen>(defaultOpen)
  const isAdmin = useIsAdmin()

  const handleOpenModal = (e: MouseEvent, type: keyof typeof open) => {
    e.stopPropagation()
    setOpen((prev) => ({ ...prev, [type]: true }))
  }

  const handleCloseModal = () => {
    setOpen(defaultOpen)
  }

  if (!isAdmin) return null

  return (
    <>
      <Track {...SPACE_EVENTS.EDIT_ADDRESS}>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Edit entry"
                onClick={(e) => handleOpenModal(e, ModalType.EDIT)}
              />
            }
          >
            <EditIcon className="size-4 text-[var(--color-border-main)]" />
          </TooltipTrigger>
          <TooltipContent>Edit entry</TooltipContent>
        </Tooltip>
      </Track>

      <Track {...SPACE_EVENTS.REMOVE_ADDRESS}>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Delete entry"
                onClick={(e) => handleOpenModal(e, ModalType.REMOVE)}
              />
            }
          >
            <DeleteIcon className="size-4 text-[var(--color-error-main)]" />
          </TooltipTrigger>
          <TooltipContent>Delete entry</TooltipContent>
        </Tooltip>
      </Track>

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
}

export default SpaceAddressBookActions
