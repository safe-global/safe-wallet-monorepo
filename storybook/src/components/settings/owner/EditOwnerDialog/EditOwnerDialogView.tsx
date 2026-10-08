import type { FormEventHandler, ReactNode } from 'react'
import ModalDialog from '@/components/common/ModalDialog'
import Track from '@/components/common/Track'
import { SETTINGS_EVENTS } from '@/services/analytics/events/settings'
import EditIcon from '@/public/images/common/edit.svg'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export type EditOwnerDialogViewProps = {
  open: boolean
  onOpen: () => void
  onClose: () => void
  onSubmit: FormEventHandler<HTMLFormElement>
  buttonDisabled: boolean
  renderNameInput: (props: { label: string; name: string; required: boolean }) => ReactNode
  addressInfo: ReactNode
}

export const EditOwnerDialogView = ({
  open,
  onOpen,
  onClose,
  onSubmit,
  buttonDisabled,
  renderNameInput,
  addressInfo,
}: EditOwnerDialogViewProps) => {
  return (
    <>
      <Track {...SETTINGS_EVENTS.SETUP.EDIT_OWNER}>
        <Tooltip>
          <TooltipTrigger
            render={
              <span>
                <Button variant="ghost" size="icon-sm" onClick={onOpen}>
                  <EditIcon className="size-4 text-muted-foreground" />
                </Button>
              </span>
            }
          />
          <TooltipContent>Edit signer</TooltipContent>
        </Tooltip>
      </Track>

      <ModalDialog open={open} onClose={onClose} dialogTitle="Edit signer name">
        <form onSubmit={onSubmit}>
          <div className="p-6">
            <div className="py-4">{renderNameInput({ label: 'Signer name', name: 'name', required: true })}</div>

            <div className="py-4">{addressInfo}</div>
          </div>

          <div className="flex justify-between gap-2 p-6 pt-0">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={buttonDisabled}>
              Save
            </Button>
          </div>
        </form>
      </ModalDialog>
    </>
  )
}
