import { useState } from 'react'
import { Download, FileUp } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import ExportDialog from '@/components/address-book/ExportDialog'
import ImportDialog from '@/components/address-book/ImportDialog'
import { trackEvent } from '@/services/analytics'
import { ADDRESS_BOOK_EVENTS } from '@/services/analytics/events/addressBook'
import ImportIcon from '@/public/images/common/import.svg'
import ExportIcon from '@/public/images/common/export.svg'
import type { TriggerSize } from './AddContactDialog'

// Tells these clicks apart from the Safe-level address book toolbar
const TRACK_LABEL = 'workspace_local_contacts'

type LocalContactsCsvActionsProps = {
  hasContacts: boolean
  size?: TriggerSize
}

// Same CSV import/export as the Safe-level address book: both dialogs cover every chain's local book.
// Tracked on click, not with <Track>: its wrapper would break the ButtonGroup corners
const LocalContactsCsvActions = ({ hasContacts, size = 'action' }: LocalContactsCsvActionsProps) => {
  const [openDialog, setOpenDialog] = useState<'import' | 'export'>()
  const handleClose = () => setOpenDialog(undefined)
  // The v2 toolbar (`lg`) uses lucide icons, like the Workspace contacts tab; the v1 page keeps its SVGs
  const isV2 = size === 'lg'

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
        {isV2 ? <FileUp aria-hidden="true" data-icon="inline-start" /> : <ImportIcon className="size-4" />}
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
        {isV2 ? <Download aria-hidden="true" data-icon="inline-start" /> : <ExportIcon className="size-4" />}
        Export
      </Button>

      {openDialog === 'import' && <ImportDialog handleClose={handleClose} />}
      {openDialog === 'export' && <ExportDialog handleClose={handleClose} />}
    </>
  )
}

export default LocalContactsCsvActions
