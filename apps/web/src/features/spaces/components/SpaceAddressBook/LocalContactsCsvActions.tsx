import { useState } from 'react'
import { Button } from '@safe-global/views/components/ui/button'
import ExportDialog from '@/components/address-book/ExportDialog'
import ImportDialog from '@/components/address-book/ImportDialog'
import { trackEvent } from '@/services/analytics'
import { ADDRESS_BOOK_EVENTS } from '@/services/analytics/events/addressBook'
import ImportIcon from '@/public/images/common/import.svg'
import type { TriggerSize } from './AddContactDialog'
import ExportIcon from '@/public/images/common/export.svg'

// Tells these clicks apart from the Safe-level address book toolbar
const TRACK_LABEL = 'workspace_local_contacts'

type LocalContactsCsvActionsProps = {
  hasContacts: boolean
  size?: TriggerSize
}

// Same CSV import/export as the Safe-level address book: both dialogs cover every chain's local book.
// The buttons are tracked on click, not with <Track>, so a ButtonGroup can join them.
const LocalContactsCsvActions = ({ hasContacts, size = 'action' }: LocalContactsCsvActionsProps) => {
  const [openDialog, setOpenDialog] = useState<'import' | 'export'>()
  const handleClose = () => setOpenDialog(undefined)

  return (
    <>
      <Button
        variant="outline"
        size={size}
        onClick={() => {
          trackEvent({ ...ADDRESS_BOOK_EVENTS.IMPORT_BUTTON, label: TRACK_LABEL })
          setOpenDialog('import')
        }}
      >
        <ImportIcon className="size-4" />
        Import
      </Button>

      <Button
        variant="outline"
        size={size}
        onClick={() => {
          trackEvent({ ...ADDRESS_BOOK_EVENTS.DOWNLOAD_BUTTON, label: TRACK_LABEL })
          setOpenDialog('export')
        }}
        disabled={!hasContacts}
      >
        <ExportIcon className="size-4" />
        Export
      </Button>

      {openDialog === 'import' && <ImportDialog handleClose={handleClose} />}
      {openDialog === 'export' && <ExportDialog handleClose={handleClose} />}
    </>
  )
}

export default LocalContactsCsvActions
