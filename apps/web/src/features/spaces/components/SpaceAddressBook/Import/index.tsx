import PlusIcon from '@/public/images/common/plus.svg'
import { Button } from '@mui/material'
import { useState } from 'react'
import ImportContactsDialog from '@/features/spaces/components/SpaceAddressBook/Import/ImportContactsDialog'

const ImportAddressBook = () => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="contained" startIcon={<PlusIcon />} onClick={() => setOpen(true)}>
        Import contacts
      </Button>
      {open && <ImportContactsDialog handleClose={() => setOpen(false)} />}
    </>
  )
}

export default ImportAddressBook
