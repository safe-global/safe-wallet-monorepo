import ImportIcon from '@/public/images/common/import.svg'
import { Button } from '@mui/material'
import { useState } from 'react'
import ImportContactsDialog from '@/features/spaces/components/SpaceAddressBook/Import/ImportContactsDialog'

const ImportAddressBook = () => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="text" size="small" startIcon={<ImportIcon />} onClick={() => setOpen(true)}>
        Import
      </Button>
      {open && <ImportContactsDialog handleClose={() => setOpen(false)} />}
    </>
  )
}

export default ImportAddressBook
