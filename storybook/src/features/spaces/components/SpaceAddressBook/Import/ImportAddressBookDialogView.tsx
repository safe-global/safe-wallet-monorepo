import type { FormEventHandler, ReactNode } from 'react'
import { Alert } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { SearchInput } from '@/components/ui/search-input'
import DialogActions from '@/components/common/DialogActions'

export type ImportAddressBookDialogViewProps = {
  onClose: () => void
  onSubmit: FormEventHandler<HTMLFormElement>
  onSearch: (value: string) => void
  contactsList: ReactNode
  error?: string
  selectedCount: number
  isSubmitting: boolean
  isSuccess: boolean
  hasNoImportableContacts: boolean
}

export const ImportAddressBookDialogView = ({
  onClose,
  onSubmit,
  onSearch,
  contactsList,
  error,
  selectedCount,
  isSubmitting,
  isSuccess,
  hasNoImportableContacts,
}: ImportAddressBookDialogViewProps) => (
  <Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
    <DialogContent padding="none">
      <DialogHeader divided>
        <DialogTitle className="font-bold text-xl">Import address book</DialogTitle>
      </DialogHeader>

      <form onSubmit={onSubmit}>
        <div className="px-4 pt-4 mb-2">
          <SearchInput
            id="search-by-name"
            placeholder="Search"
            aria-label="Search contact list by name or address"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>

        {contactsList}

        <DialogFooter divided className="items-stretch">
          {error && <Alert variant="destructive">{error}</Alert>}

          <DialogActions
            onCancel={onClose}
            cancelTestId="cancel-btn"
            confirmLabel={`Import contacts (${selectedCount})`}
            confirmType="submit"
            confirmLoading={isSubmitting}
            confirmDisabled={selectedCount === 0 || isSuccess}
            confirmTooltip={hasNoImportableContacts ? 'You have no new contacts to import.' : undefined}
          />
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
)
