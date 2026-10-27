import { useState } from 'react'
import { Button } from '@safe-global/views/components/ui/button'
import ExportDialog from '@/components/address-book/ExportDialog'
import ImportDialog from '@/components/address-book/ImportDialog'
import Track from '@/components/common/Track'
import { ADDRESS_BOOK_EVENTS } from '@/services/analytics/events/addressBook'
import ImportIcon from '@/public/images/common/import.svg'
import ExportIcon from '@/public/images/common/export.svg'

// Same CSV import/export as the Safe-level address book: both dialogs cover every chain's local book
const LocalContactsCsvActions = ({ hasContacts }: { hasContacts: boolean }) => {
  const [openDialog, setOpenDialog] = useState<'import' | 'export'>()
  const handleClose = () => setOpenDialog(undefined)

  return (
    <>
      <Track {...ADDRESS_BOOK_EVENTS.IMPORT_BUTTON}>
        <Button variant="outline" size="action" onClick={() => setOpenDialog('import')}>
          <ImportIcon className="size-4" />
          Import
        </Button>
      </Track>

      <Track {...ADDRESS_BOOK_EVENTS.DOWNLOAD_BUTTON}>
        <Button variant="outline" size="action" onClick={() => setOpenDialog('export')} disabled={!hasContacts}>
          <ExportIcon className="size-4" />
          Export
        </Button>
      </Track>

      {openDialog === 'import' && <ImportDialog handleClose={handleClose} />}
      {openDialog === 'export' && <ExportDialog handleClose={handleClose} />}
    </>
  )
}

export default LocalContactsCsvActions
