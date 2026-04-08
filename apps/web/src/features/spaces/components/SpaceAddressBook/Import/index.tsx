import ImportIcon from '@/public/images/common/import.svg'
import { Button, SvgIcon } from '@mui/material'
import { useState } from 'react'
import ImportAddressBookDialog from './ImportAddressBookDialog'

const ImportAddressBook = () => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        startIcon={<SvgIcon component={ImportIcon} inheritViewBox fontSize="small" color="primary" />}
        onClick={() => setOpen(true)}
      >
        Import
      </Button>
      {open && <ImportAddressBookDialog handleClose={() => setOpen(false)} />}
    </>
  )
}

export default ImportAddressBook
