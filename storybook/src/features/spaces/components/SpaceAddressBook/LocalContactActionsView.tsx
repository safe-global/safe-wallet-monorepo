import type { MouseEvent, ReactNode } from 'react'
import EditIcon from '@/public/images/common/edit.svg'
import DeleteIcon from '@/public/images/common/delete.svg'
import ModalDialog from '@/components/common/ModalDialog'
import { Button } from '@/components/ui/button'
import DialogActions from '@/components/common/DialogActions'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'

export type LocalContactActionsViewProps = {
  name: string
  onEdit: (e: MouseEvent) => void
  onRemove: (e: MouseEvent) => void
  isRemoveOpen: boolean
  onCloseModal: () => void
  onConfirmRemove: () => void
  /** The edit dialog, set while it is open. */
  editDialog?: ReactNode
}

export const LocalContactActionsView = ({
  name,
  onEdit,
  onRemove,
  isRemoveOpen,
  onCloseModal,
  onConfirmRemove,
  editDialog,
}: LocalContactActionsViewProps) => (
  <>
    <Tooltip>
      <TooltipTrigger render={<Button type="button" variant="ghost" size="icon-sm" onClick={onEdit} />}>
        <EditIcon className="size-4 text-[var(--color-border-main)]" />
      </TooltipTrigger>
      <TooltipContent>Edit contact</TooltipContent>
    </Tooltip>

    <Tooltip>
      <TooltipTrigger render={<Button type="button" variant="ghost" size="icon-sm" onClick={onRemove} />}>
        <DeleteIcon className="size-4 text-[var(--color-error-main)]" />
      </TooltipTrigger>
      <TooltipContent>Delete contact</TooltipContent>
    </Tooltip>

    {editDialog}

    {isRemoveOpen && (
      <ModalDialog open onClose={onCloseModal} dialogTitle="Delete contact" hideChainIndicator>
        <div className="px-6 py-4">
          <Typography variant="paragraph-small">
            This removes <b>{name}</b> from the address book in this browser on all its networks.
          </Typography>
        </div>
        <DialogActions
          className="px-6 pt-0 pb-6"
          onCancel={onCloseModal}
          cancelTestId="cancel-btn"
          confirmLabel="Delete"
          onConfirm={onConfirmRemove}
          confirmDestructive
          confirmTestId="delete-btn"
        />
      </ModalDialog>
    )}
  </>
)
