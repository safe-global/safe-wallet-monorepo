import ImportIcon from '@/public/images/common/import.svg'
import { Button } from '@mui/material'
import { useState } from 'react'
import ImportAddressBookDialog from '@/features/spaces/components/SpaceAddressBook/Import/ImportAddressBookDialog'

const ImportAddressBook = () => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="text" size="small" startIcon={<ImportIcon />} onClick={() => setOpen(true)}>
        Import
      </Button>
      {open && <ImportAddressBookDialog handleClose={() => setOpen(false)} />}
    </>
  )
}

export default ImportAddressBook
