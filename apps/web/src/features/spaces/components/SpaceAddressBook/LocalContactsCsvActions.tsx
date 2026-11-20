import { useState, type ReactNode } from 'react'
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

export type CsvActionIcons = { import: ReactNode; export: ReactNode }

const SVG_ICONS: CsvActionIcons = {
  import: <ImportIcon className="size-4" />,
  export: <ExportIcon className="size-4" />,
}

type LocalContactsCsvActionsProps = {
  hasContacts: boolean
  size?: TriggerSize
  /** The v2 address book passes lucide icons; the v1 page keeps the SVGs. */
  icons?: CsvActionIcons
}

// Same CSV import/export as the Safe-level address book: both dialogs cover every chain's local book.
// Tracked on click, not with <Track>: its wrapper would break the ButtonGroup corners
const LocalContactsCsvActions = ({ hasContacts, size = 'action', icons = SVG_ICONS }: LocalContactsCsvActionsProps) => {
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
        {icons.import}
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
        {icons.export}
        Export
      </Button>

      {openDialog === 'import' && <ImportDialog handleClose={handleClose} />}
      {openDialog === 'export' && <ExportDialog handleClose={handleClose} />}
    </>
  )
}

export default LocalContactsCsvActions
