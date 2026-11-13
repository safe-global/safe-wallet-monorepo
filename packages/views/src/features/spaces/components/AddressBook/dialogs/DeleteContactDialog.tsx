import { Button } from '@safe-global/views/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@safe-global/views/components/ui/dialog'
import { Spinner } from '@safe-global/views/components/ui/spinner'
import ChainLogos from '../ChainLogos'
import GroupedAddress from '../GroupedAddress'
import type { AddressBookContact } from '../types'

type DeleteContactDialogProps = {
  contact: Pick<AddressBookContact, 'name' | 'address' | 'chains'>
  onConfirm: () => void
  onClose: () => void
  isSubmitting?: boolean
}

/** Confirms deleting a contact from the workspace book, for every member and on every chain listed. */
const DeleteContactDialog = ({ contact, onConfirm, onClose, isSubmitting = false }: DeleteContactDialogProps) => (
  <Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
    <DialogContent padding="none" size="sm">
      <DialogHeader divided>
        <DialogTitle className="text-xl font-bold">Delete contact</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-4 p-6">
        <DialogDescription>
          Delete <strong className="text-foreground">{contact.name}</strong> from the workspace address book? Everyone
          in the workspace will stop seeing this name on the networks below.
        </DialogDescription>
        <div className="bg-muted/40 flex flex-wrap items-center justify-between gap-2 rounded-md px-3 py-2.5">
          <GroupedAddress address={contact.address} />
          <ChainLogos chains={contact.chains} />
        </div>
      </div>
      <DialogFooter divided className="flex-row items-center justify-between">
        <Button variant="outline" size="submit" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="destructive"
          size="submit"
          onClick={onConfirm}
          disabled={isSubmitting}
          data-testid="delete-btn"
        >
          {isSubmitting ? <Spinner /> : 'Delete'}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)

export default DeleteContactDialog
